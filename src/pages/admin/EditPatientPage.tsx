import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { PatientFormSection } from '@/components/PatientFormSection';
import { ArrowLeft, Loader2, User, MapPin, Stethoscope, UserPen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COUNTRY_CODES } from '@/lib/country-codes';

type AgeUnit = 'years' | 'months';

const GENDERS = ['Male', 'Female', 'Other'] as const;

const patientFormErrors = (d: Record<string, unknown>): string[] => {
  const errs: string[] = [];
  if (!String(d.name ?? '').trim()) errs.push('Name is required');
  if (!String(d.mobile ?? '').trim()) errs.push('Mobile number is required');
  else {
    const mobile = String(d.mobile).replace(/\D/g, '');
    if (mobile.length < 10) errs.push('Enter a valid 10-digit mobile number');
  }
  const age = d.age;
  const unit: AgeUnit = d.ageUnit === 'months' ? 'months' : 'years';
  if (age === '' || age == null || (typeof age === 'string' && !age.trim())) errs.push('Age is required');
  else {
    const n = Number(age);
    if (!Number.isInteger(n) || n < 0) errs.push('Enter a valid whole number for age');
    else if (unit === 'months' && n > 1800) errs.push('Age in months must be at most 1800');
    else if (unit === 'years' && n > 150) errs.push('Age in years must be 0–150');
  }
  if (!String(d.gender ?? '').trim()) errs.push('Gender is required');
  if (!String(d.address ?? '').trim()) errs.push('Address is required');
  return errs;
};

/** Parse full mobile (e.g. 919876543210) to countryCode + number */
function parseMobile(full: string): { countryCode: string; mobile: string } {
  const digits = String(full || '').replace(/\D/g, '');
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (digits.startsWith(c.code)) {
      return { countryCode: c.code, mobile: digits.slice(c.code.length) };
    }
  }
  return { countryCode: '91', mobile: digits };
}

const choiceActive =
  'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-500/30';
const choiceIdle =
  'border-border/80 bg-background hover:border-emerald-400/50 hover:bg-muted/40 dark:hover:bg-muted/20';

const EditPatientPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    countryCode: '91',
    mobile: '',
    name: '',
    age: '',
    ageUnit: 'years' as AgeUnit,
    gender: '',
    address: '',
    pincode: '',
    medicalHistory: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const ageUnit: AgeUnit = formData.ageUnit === 'months' ? 'months' : 'years';

  const setAgeUnit = (u: AgeUnit) => {
    setFormData((f) => {
      const raw = String(f.age ?? '').replace(/\D/g, '');
      const maxLen = u === 'years' ? 3 : 4;
      const nextAge = raw.slice(0, maxLen);
      return { ...f, ageUnit: u, age: nextAge };
    });
  };

  const handleAgeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const maxLen = ageUnit === 'years' ? 3 : 4;
    setFormData((f) => ({ ...f, age: digits.slice(0, maxLen) }));
  };

  useEffect(() => {
    if (!id) {
      navigate('/admin/patients');
      return;
    }
    api.patients
      .get(id)
      .then((p) => {
        const { countryCode, mobile } = parseMobile((p.mobile as string) || '');
        const unit: AgeUnit = String(p.ageUnit ?? '').toLowerCase() === 'months' ? 'months' : 'years';
        setFormData({
          countryCode,
          mobile,
          name: p.name ?? '',
          age: p.age != null ? String(p.age) : '',
          ageUnit: unit,
          gender: p.gender ?? '',
          address: p.address ?? '',
          pincode: p.pincode ?? '',
          medicalHistory: p.medicalHistory ?? '',
        });
      })
      .catch(() => {
        toast({ title: 'Patient not found', variant: 'destructive' });
        navigate('/admin/patients');
      })
      .finally(() => setFetching(false));
  }, [id, navigate, toast]);

  const handleSave = async () => {
    const errs = patientFormErrors(formData);
    setFormErrors(errs);
    if (errs.length > 0) {
      toast({ title: 'Validation error', description: errs[0], variant: 'destructive' });
      return;
    }
    if (!id) return;
    setLoading(true);
    try {
      const countryCode = String(formData.countryCode ?? '91').replace(/\D/g, '');
      const mobileNum = String(formData.mobile ?? '').replace(/\D/g, '');
      const mobile = countryCode ? `${countryCode}${mobileNum}` : mobileNum;
      await api.patients.update(id, {
        name: String(formData.name).trim(),
        mobile,
        age: Number(formData.age),
        ageUnit: formData.ageUnit === 'months' ? 'months' : 'years',
        gender: String(formData.gender).trim(),
        address: String(formData.address).trim(),
        pincode: formData.pincode ? String(formData.pincode).replace(/\D/g, '') : undefined,
        medicalHistory: formData.medicalHistory ? String(formData.medicalHistory).trim() : undefined,
      });
      setFormErrors([]);
      toast({ title: 'Patient updated', description: 'Changes saved successfully.' });
      navigate('/admin/patients');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Update failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'mt-1.5 h-10 transition-shadow focus-visible:ring-2 focus-visible:ring-emerald-500/30';
  const genderErr = formErrors.some((e) => e.includes('Gender'));

  if (fetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col flex-1 min-h-0 gap-4">
      <div className="flex w-full min-w-0 shrink-0 items-stretch gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:items-center sm:p-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg border border-transparent hover:border-border hover:bg-muted/60" asChild>
          <Link to="/admin/patients" aria-label="Back to patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-start gap-3 border-l border-border/60 pl-3 sm:items-center">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md sm:flex">
            <UserPen className="h-5 w-5" />
          </div>
          <PageHeader
            title="Edit Patient / Beneficiary"
            description="Update patient details. All fields except Medical History are required."
            className="min-w-0 flex-1 !flex-col !items-start gap-0"
          />
        </div>
      </div>

      <Card className="w-full min-w-0 flex-1 min-h-0 overflow-auto border-border/60 shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <CardContent className="w-full min-w-0 space-y-6 p-4 sm:p-6">
          {formErrors.length > 0 && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              <p className="font-medium">Please fix the following:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 opacity-95">
                {formErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <PatientFormSection
            icon={<User className="h-5 w-5" />}
            title="Patient profile"
            description="Legal name, contact, age, and gender used across consultations and records."
          >
            <div className="w-full space-y-5">
              <div className="w-full min-w-0">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Patient name / Beneficiary <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={(formData.name as string) || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name as on records"
                  className={cn(fieldClass, formErrors.some((e) => e.includes('Name')) && 'border-destructive')}
                />
              </div>

              <div className="w-full min-w-0">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mobile <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                  <Select value={(formData.countryCode as string) || '91'} onValueChange={(v) => setFormData({ ...formData, countryCode: v })}>
                    <SelectTrigger className="h-10 w-full sm:w-[140px] sm:shrink-0">
                      <SelectValue placeholder="Code" />
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
                    inputMode="numeric"
                    className={cn(
                      'h-10 min-w-0 flex-1',
                      formErrors.some((e) => e.includes('Mobile') || e.includes('mobile')) && 'border-destructive',
                    )}
                  />
                </div>
              </div>

              <div className="w-full min-w-0">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <div
                  className={cn('mt-2 grid grid-cols-3 gap-2', genderErr && 'rounded-lg p-0.5 ring-2 ring-destructive/25')}
                  role="radiogroup"
                  aria-label="Gender"
                >
                  {GENDERS.map((g) => {
                    const selected = formData.gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={cn(
                          'rounded-lg border-2 px-2 py-2.5 text-center text-xs font-semibold transition-all duration-150 sm:px-3 sm:py-3 sm:text-sm',
                          selected ? choiceActive : choiceIdle,
                        )}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full min-w-0">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Age <span className="text-destructive">*</span>
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose years or months, then enter a whole number.</p>
                <div
                  className={cn(
                    'mt-2 grid w-full grid-cols-2 gap-2',
                    formErrors.some((e) => e.includes('Age')) && 'rounded-lg p-0.5 ring-2 ring-destructive/25',
                  )}
                  role="radiogroup"
                  aria-label="Age unit"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={ageUnit === 'years'}
                    onClick={() => setAgeUnit('years')}
                    className={cn(
                      'rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150',
                      ageUnit === 'years' ? choiceActive : choiceIdle,
                    )}
                  >
                    Years
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={ageUnit === 'months'}
                    onClick={() => setAgeUnit('months')}
                    className={cn(
                      'rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150',
                      ageUnit === 'months' ? choiceActive : choiceIdle,
                    )}
                  >
                    Months
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={(formData.age as string) ?? ''}
                  onChange={(e) => handleAgeInput(e.target.value)}
                  placeholder={ageUnit === 'years' ? 'e.g. 42' : 'e.g. 18'}
                  className={cn(
                    'mt-3 h-11 w-full text-base',
                    formErrors.some((e) => e.includes('Age')) && 'border-destructive',
                  )}
                  aria-label={ageUnit === 'years' ? 'Age in years' : 'Age in months'}
                />
              </div>
            </div>
          </PatientFormSection>

          <PatientFormSection
            icon={<MapPin className="h-5 w-5" />}
            title="Address"
            description="Enter the full address first, then pincode if you have it. Nothing is fetched automatically."
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Full address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={(formData.address as string) || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, area, city, state (press Enter for a new line)"
                  rows={4}
                  className={cn(
                    'mt-1.5 min-h-[120px] resize-y bg-background/80',
                    formErrors.some((e) => e.includes('Address')) && 'border-destructive',
                  )}
                />
              </div>
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pincode (India)</Label>
                <Input
                  value={(formData.pincode as string) || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit pincode (optional)"
                  maxLength={6}
                  inputMode="numeric"
                  className="mt-1.5 h-11 w-full"
                />
              </div>
            </div>
          </PatientFormSection>

          <PatientFormSection
            icon={<Stethoscope className="h-5 w-5" />}
            title="Medical history"
            description="Optional. Allergies, chronic conditions, surgeries — helps doctors during visits."
          >
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes <span className="text-muted-foreground font-normal normal-case">(optional)</span>
              </Label>
              <Textarea
                value={(formData.medicalHistory as string) || ''}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Past conditions, allergies, ongoing medication, etc."
                rows={4}
                className="mt-1.5 min-h-[100px] resize-y bg-background/80"
              />
            </div>
          </PatientFormSection>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" className="h-11 w-full sm:w-auto" asChild>
              <Link to="/admin/patients">Cancel</Link>
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="h-11 w-full bg-emerald-600 font-semibold shadow-md hover:bg-emerald-700 sm:min-w-[180px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPatientPage;
