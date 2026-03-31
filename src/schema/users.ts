import { z } from 'zod';

export const userCreateSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^\S+$/, 'Username cannot contain spaces')
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'doctor', 'nurse'], {
    required_error: 'Role is required',
    invalid_type_error: 'Select a valid role',
  }),
  linkedDoctorId: z.string().optional().nullable(),
  allowedNavPaths: z.array(z.string()).optional().nullable(),
  clinicIds: z.array(z.string()).optional(),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const setPasswordSchema = z.object({
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;
