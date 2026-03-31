import { z } from 'zod';

const ageUnitSchema = z.enum(['years', 'months']);

export const patientSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .trim(),
  countryCode: z.string().default('91'),
  mobile: z
    .string({ required_error: 'Mobile number is required' })
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  ageUnit: ageUnitSchema.default('years'),
  age: z
    .string({ required_error: 'Age is required' })
    .min(1, 'Age is required')
    .regex(/^\d+$/, 'Enter a valid whole number for age'),
  gender: z
    .string({ required_error: 'Gender is required' })
    .min(1, 'Gender is required'),
  address: z
    .string({ required_error: 'Address is required' })
    .min(1, 'Address is required')
    .trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
    .optional()
    .or(z.literal('')),
  medicalHistory: z.string().optional(),
}).superRefine((data, ctx) => {
  const n = Number(data.age);
  if (!Number.isInteger(n) || n < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid whole number for age', path: ['age'] });
  } else if (data.ageUnit === 'months' && n > 1800) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Age in months must be at most 1800', path: ['age'] });
  } else if (data.ageUnit === 'years' && n > 150) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Age in years must be 0–150', path: ['age'] });
  }
});

export type PatientFormValues = z.infer<typeof patientSchema>;
