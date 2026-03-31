import { z } from 'zod';

export const consultationFilterSchema = z.object({
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const consultationMedicineLineSchema = z.object({
  medicineId: z.string().min(1, 'Select a medicine'),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .regex(/^\d+$/, 'Quantity must be a whole number'),
  unitPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

export const consultationFormSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  doctorId: z.string().min(1, 'Select a doctor'),
  clinicId: z.string().min(1, 'Clinic is required'),
  date: z.string().min(1, 'Date is required'),
  chiefComplaints: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentNotes: z.string().optional(),
  followUpDate: z.string().optional(),
  medicines: z.array(consultationMedicineLineSchema).optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
    .optional()
    .or(z.literal('')),
  discount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid discount')
    .optional()
    .or(z.literal('')),
  paymentMode: z.enum(['cash', 'card', 'upi', 'other']).optional(),
});

export type ConsultationFilterValues = z.infer<typeof consultationFilterSchema>;
export type ConsultationMedicineLine = z.infer<typeof consultationMedicineLineSchema>;
export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;
