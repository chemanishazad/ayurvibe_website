import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { PatientFormSection } from '@/components/PatientFormSection';
import { ArrowLeft, Loader2, User, MapPin, Stethoscope, UserPlus, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COUNTRY_CODES } from '@/lib/country-codes';
import { patientSchema, type PatientFormValues } from '@/schema/patients';

type AgeUnit = 'years' | 'months';
const GENDERS = ['Male', 'Female', 'Other'] as const;

const choiceActive =
  'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-500/30';
const choiceIdle =
  'border-border/80 bg-background hover:border-emerald-400/50 hover:bg-muted/40 dark:hover:bg-muted/20';

/** Reusable inline field error. */
const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

const NewPatientPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      countryCode: '91',
      mobile: '',
      name: '',
      age: '',
      ageUnit: 'years',
      gender: '',
      address: '',
      pincode: '',
      medicalHistory: '',
    },
  });

  const ageUnit = watch('ageUnit') as AgeUnit;
  const gender = watch('gender');

  const handleAgeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const maxLen = ageUnit === 'years' ? 3 : 4;
    setValue('age', digits.slice(0, maxLen), { shouldValidate: true });
  };

  const setAgeUnit = (u: AgeUnit) => {
    const currentAge = watch('age');
    const digits = String(currentAge ?? '').replace(/\D/g, '');
    const maxLen = u === 'years' ? 3 : 4;
    setValue('ageUnit', u, { shouldValidate: false });
    setValue('age', digits.slice(0, maxLen), { shouldValidate: true });
  };

  const onSubmit = async (values: PatientFormValues) => {
    try {
      const countryCode = values.countryCode.replace(/\D/g, '');
      const mobile = `${countryCode}${values.mobile}`;
      await api.patients.create({
        name: values.name.trim(),
        mobile,
        age: Number(values.age),
        ageUnit: values.ageUnit,
        gender: values.gender.trim(),
        address: values.address.trim(),
        pincode: values.pincode ? values.pincode.replace(/\D/g, '') : undefined,
        medicalHistory: values.medicalHistory ? values.medicalHistory.trim() : undefined,
        forceCreate: true,
      });
      toast({ title: 'Patient saved', description: 'Patient registered successfully.' });
      navigate('/admin/patients');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    }
  };

  const fieldClass = 'mt-1.5 h-10 transition-shadow focus-visible:ring-2 focus-visible:ring-emerald-500/30';

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
            <UserPlus className="h-5 w-5" />
          </div>
          <PageHeader
            title="New Patient / Beneficiary"
            description="Register a new patient. All fields except Medical History are required."
            className="min-w-0 flex-1 !flex-col !items-start gap-0"
          />
        </div>
      </div>

      <Card className="w-full min-w-0 flex-1 min-h-0 overflow-auto border-border/60 shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <CardContent className="w-full min-w-0 space-y-6 p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-6">
              {/* ── Patient Profile ── */}
              <PatientFormSection
                icon={<User className="h-5 w-5" />}
                title="Patient profile"
                description="Legal name, contact, age, and gender used across consultations and records."
              >
                <div className="w-full space-y-5">
                  {/* Name */}
                  <div className="w-full min-w-0">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Patient name / Beneficiary <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Full name as on records"
                      className={cn(fieldClass, errors.name && 'border-destructive')}
                      {...register('name')}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  {/* Mobile */}
                  <div className="w-full min-w-0">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Mobile <span className="text-destructive">*</span>
                    </Label>
                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={watch('countryCode') || '91'}
                        onValueChange={(v) => setValue('countryCode', v)}
                      >
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
                        placeholder="10-digit number"
                        maxLength={10}
                        inputMode="numeric"
                        className={cn(
                          'h-10 min-w-0 flex-1',
                          errors.mobile && 'border-destructive',
                        )}
                        {...register('mobile', {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          },
                        })}
                      />
                    </div>
                    <FieldError message={errors.mobile?.message} />
                  </div>

                  {/* Gender */}
                  <div className="w-full min-w-0">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <div
                      className={cn('mt-2 grid grid-cols-3 gap-2', errors.gender && 'rounded-lg p-0.5 ring-2 ring-destructive/25')}
                      role="radiogroup"
                      aria-label="Gender"
                    >
                      {GENDERS.map((g) => {
                        const selected = gender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setValue('gender', g, { shouldValidate: true })}
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
                    <FieldError message={errors.gender?.message} />
                  </div>

                  {/* Age */}
                  <div className="w-full min-w-0">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Age <span className="text-destructive">*</span>
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">Choose years or months, then enter a whole number.</p>
                    <div
                      className={cn(
                        'mt-2 grid w-full grid-cols-2 gap-2',
                        errors.age && 'rounded-lg p-0.5 ring-2 ring-destructive/25',
                      )}
                      role="radiogroup"
                      aria-label="Age unit"
                    >
                      {(['years', 'months'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          role="radio"
                          aria-checked={ageUnit === unit}
                          onClick={() => setAgeUnit(unit)}
                          className={cn(
                            'rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150',
                            ageUnit === unit ? choiceActive : choiceIdle,
                          )}
                        >
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={watch('age') ?? ''}
                      onChange={(e) => handleAgeInput(e.target.value)}
                      placeholder={ageUnit === 'years' ? 'e.g. 42' : 'e.g. 18'}
                      className={cn('mt-3 h-11 w-full text-base', errors.age && 'border-destructive')}
                      aria-label={ageUnit === 'years' ? 'Age in years' : 'Age in months'}
                    />
                    <FieldError message={errors.age?.message} />
                  </div>
                </div>
              </PatientFormSection>

              {/* ── Address ── */}
              <PatientFormSection
                icon={<MapPin className="h-5 w-5" />}
                title="Address"
                description="Enter the full address first, then pincode if you have it."
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Full address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Street, area, city, state (press Enter for a new line)"
                      rows={4}
                      className={cn('mt-1.5 min-h-[120px] resize-y bg-background/80', errors.address && 'border-destructive')}
                      {...register('address')}
                    />
                    <FieldError message={errors.address?.message} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pincode (India)</Label>
                    <Input
                      placeholder="6-digit pincode (optional)"
                      maxLength={6}
                      inputMode="numeric"
                      className="mt-1.5 h-11 w-full"
                      {...register('pincode', {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        },
                      })}
                    />
                    <FieldError message={errors.pincode?.message} />
                  </div>
                </div>
              </PatientFormSection>

              {/* ── Medical History ── */}
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
                    placeholder="Past conditions, allergies, ongoing medication, etc."
                    rows={4}
                    className="mt-1.5 min-h-[100px] resize-y bg-background/80"
                    {...register('medicalHistory')}
                  />
                </div>
              </PatientFormSection>

              {/* ── Actions ── */}
              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="outline" className="h-11 w-full sm:w-auto" asChild>
                  <Link to="/admin/patients">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full bg-emerald-600 font-semibold shadow-md hover:bg-emerald-700 sm:min-w-[180px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save patient'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPatientPage;
