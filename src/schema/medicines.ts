import { z } from 'zod';

export const medicineSchema = z.object({
  name: z
    .string({ required_error: 'Medicine name is required' })
    .min(1, 'Medicine name is required')
    .trim(),
  uom: z
    .string({ required_error: 'Unit of measure is required' })
    .min(1, 'Unit of measure is required'),
  purchasePrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid purchase price')
    .optional()
    .or(z.literal('')),
  sellingPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid selling price')
    .optional()
    .or(z.literal('')),
  minStockLevel: z
    .number({ invalid_type_error: 'Enter a valid min stock level' })
    .int()
    .min(0, 'Min stock must be 0 or more')
    .optional(),
});

export type MedicineFormValues = z.infer<typeof medicineSchema>;
