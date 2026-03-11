import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Search, History, Stethoscope } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PatientsPage = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!mobile.trim()) {
      toast({ title: 'Enter mobile number', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setPatient(null);
    try {
      const res = await api.patients.search(mobile.trim());
      if (res.exists && res.patient) {
        setPatient(res.patient as Record<string, unknown>);
        setFormData(res.patient as Record<string, unknown>);
      } else {
        setFormData({ mobile: mobile.trim(), name: '', age: '', gender: '', address: '', medicalHistory: '' });
        setShowForm(true);
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Search failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    setLoading(true);
    try {
      const created = await api.patients.create(formData);
      setPatient(created as Record<string, unknown>);
      setShowForm(false);
      toast({ title: 'Patient saved', description: 'Patient registered successfully.' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (id: string) => {
    try {
      const h = await api.patients.history(id);
      setHistory(h);
      setHistoryPatientId(id);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load history', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patient Management</h1>
        <p className="text-muted-foreground">Search by mobile number to find or register patients</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patient
          </CardTitle>
          <CardDescription>Enter mobile number as primary identifier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Mobile number (e.g. 9876543210)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          {patient && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{(patient.name as string) || 'Unknown'}</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate('/admin/consultations', { state: { patientId: patient.id } })}>
                    <Stethoscope className="h-4 w-4 mr-1" />
                    New Consultation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewHistory(patient.id as string)}>
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Mobile: {patient.mobile as string}</p>
              <p className="text-xs text-muted-foreground font-mono">ID: {patient.id as string}</p>
              {patient.age && <p className="text-sm">Age: {patient.age as number}</p>}
              {patient.gender && <p className="text-sm">Gender: {patient.gender as string}</p>}
              {patient.address && <p className="text-sm">Address: {patient.address as string}</p>}
              {patient.medicalHistory && (
                <p className="text-sm">Medical History: {patient.medicalHistory as string}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{patient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
            <DialogDescription>Enter patient details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={(formData.name as string) || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input
                value={(formData.mobile as string) || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={(formData.age as string) ?? ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={(formData.gender as string) || ''}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={(formData.address as string) || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
              />
            </div>
            <div>
              <Label>Medical History</Label>
              <Textarea
                value={(formData.medicalHistory as string) || ''}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Past conditions, allergies, etc."
                rows={3}
              />
            </div>
            <Button onClick={handleCreateOrUpdate} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Patient'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyPatientId} onOpenChange={() => setHistoryPatientId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient History</DialogTitle>
            <DialogDescription>Consultation history</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            {history.length === 0 ? (
              <p className="text-muted-foreground">No consultations found</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{h.consultationDate as string}</span>
                    <span>₹{(h.totalAmount as string) || 0}</span>
                  </div>
                  <p className="text-muted-foreground">Doctor: {h.doctorName as string}</p>
                  {h.diagnosis && <p>Diagnosis: {h.diagnosis as string}</p>}
                  {h.symptoms && <p>Symptoms: {h.symptoms as string}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsPage;
