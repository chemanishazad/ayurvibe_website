import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COUNTRY_CODES } from '@/lib/country-codes';
import { fetchLocationByPincode } from '@/lib/pincode-api';

const patientFormErrors = (d: Record<string, unknown>): string[] => {
  const errs: string[] = [];
  if (!String(d.name ?? '').trim()) errs.push('Name is required');
  if (!String(d.mobile ?? '').trim()) errs.push('Mobile number is required');
  else {
    const mobile = String(d.mobile).replace(/\D/g, '');
    if (mobile.length < 10) errs.push('Enter a valid 10-digit mobile number');
  }
  const age = d.age;
  if (age === '' || age == null || (typeof age === 'string' && !age.trim())) errs.push('Age is required');
  else if (Number(age) < 0 || Number(age) > 150) errs.push('Age must be 0–150');
  if (!String(d.gender ?? '').trim()) errs.push('Gender is required');
  if (!String(d.address ?? '').trim()) errs.push('Address is required');
  return errs;
};

const NewPatientPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeLocation, setPincodeLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    countryCode: '91',
    mobile: '',
    name: '',
    age: '',
    gender: '',
    address: '',
    pincode: '',
    medicalHistory: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const lastFetchedPincode = useRef<string>('');

  useEffect(() => {
    const pin = String(formData.pincode ?? '').replace(/\D/g, '');
    if (pin.length !== 6) {
      lastFetchedPincode.current = '';
      setPincodeLocation(null);
      return;
    }
    if (lastFetchedPincode.current === pin) return;
    lastFetchedPincode.current = pin;
    setPincodeLoading(true);
    setPincodeLocation(null);
    fetchLocationByPincode(pin)
      .then((result) => {
        if (result) {
          setPincodeLocation(result.location);
          setFormData((f) => ({
            ...f,
            address: f.address ? `${f.address}\n${result.location}` : result.location,
          }));
        } else {
          setPincodeLocation(null);
          toast({ title: 'Pincode not found', description: 'Enter a valid 6-digit Indian pincode', variant: 'destructive' });
        }
      })
      .catch(() => {
        setPincodeLocation(null);
        toast({ title: 'Failed to fetch location', variant: 'destructive' });
      })
      .finally(() => setPincodeLoading(false));
  }, [formData.pincode, toast]);

  const handleCreate = async () => {
    const errs = patientFormErrors(formData);
    setFormErrors(errs);
    if (errs.length > 0) {
      toast({ title: 'Validation error', description: errs[0], variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const countryCode = String(formData.countryCode ?? '91').replace(/\D/g, '');
      const mobileNum = String(formData.mobile ?? '').replace(/\D/g, '');
      const mobile = countryCode ? `${countryCode}${mobileNum}` : mobileNum;
      await api.patients.create({
        name: String(formData.name).trim(),
        mobile,
        age: Number(formData.age),
        gender: String(formData.gender).trim(),
        address: String(formData.address).trim(),
        pincode: formData.pincode ? String(formData.pincode).replace(/\D/g, '') : undefined,
        medicalHistory: formData.medicalHistory ? String(formData.medicalHistory).trim() : undefined,
        forceCreate: true,
      });
      setFormErrors([]);
      toast({ title: 'Patient saved', description: 'Patient registered successfully.' });
      navigate('/admin/patients');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="New Patient / Beneficiary"
          description="Register a new patient. All fields except Medical History are required."
        />
      </div>

      <Card className="flex-1 min-h-0 overflow-auto">
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>Enter beneficiary information. Press Enter in Address field for new line.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-2xl space-y-6">
          {formErrors.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <ul className="list-disc list-inside space-y-0.5">
                {formErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Patient Name / Beneficiary <span className="text-destructive">*</span></Label>
              <Input
                value={(formData.name as string) || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                className={cn('mt-1.5', formErrors.some((e) => e.includes('Name')) && 'border-destructive')}
              />
            </div>

            <div>
              <Label>Mobile <span className="text-destructive">*</span></Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={(formData.countryCode as string) || '91'}
                  onValueChange={(v) => setFormData({ ...formData, countryCode: v })}
                >
                  <SelectTrigger className="w-[130px] shrink-0">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.dial} {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={(formData.mobile as string) || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit number"
                  maxLength={10}
                  className={cn('flex-1', formErrors.some((e) => e.includes('Mobile') || e.includes('mobile')) && 'border-destructive')}
                />
              </div>
            </div>

            <div>
              <Label>Age <span className="text-destructive">*</span></Label>
              <Input
                type="text"
                inputMode="numeric"
                value={(formData.age as string) ?? ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                placeholder="Age"
                className={cn('mt-1.5', formErrors.some((e) => e.includes('Age')) && 'border-destructive')}
              />
            </div>

            <div>
              <Label>Gender <span className="text-destructive">*</span></Label>
              <Select
                value={(formData.gender as string) || ''}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
              >
                <SelectTrigger className={cn('mt-1.5', formErrors.some((e) => e.includes('Gender')) && 'border-destructive')}>
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
              <Label>Pincode (India)</Label>
              <div className="mt-1.5">
                <Input
                  value={(formData.pincode as string) || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit pincode (auto-fetches address)"
                  maxLength={6}
                  className="w-40"
                />
                {pincodeLoading && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </p>
                )}
              </div>
              {pincodeLocation && !pincodeLoading && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {pincodeLocation}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>Address <span className="text-destructive">*</span></Label>
              <Textarea
                value={(formData.address as string) || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address (press Enter for new line)"
                rows={4}
                className={cn('mt-1.5 resize-y min-h-[100px]', formErrors.some((e) => e.includes('Address')) && 'border-destructive')}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Medical History <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={(formData.medicalHistory as string) || ''}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Past conditions, allergies, etc."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} disabled={loading} size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Patient'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/patients">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPatientPage;
