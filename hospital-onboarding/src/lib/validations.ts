import { z } from 'zod';

export const hospitalOwnerSchema = z.object({
  owner_type: z.enum(['individual', 'company', 'government', 'ngo']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company_name: z.string().optional(),
  registration_number: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('Ghana'),
  postal_code: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  payment_method: z.string().optional(),
});

export const hospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  type: z.enum(['general', 'specialized', 'clinic', 'diagnostic_center', 'maternity']),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('Ghana'),
  postal_code: z.string().optional(),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().url().optional().or(z.literal('')),
  bed_capacity: z.number().int().positive().optional(),
  staff_count: z.number().int().positive().optional(),
  departments: z.array(z.string()).optional(),
  services_offered: z.array(z.string()).optional(),
  license_number: z.string().min(1, 'License number is required'),
  license_expiry: z.string().optional(),
  accreditations: z.array(z.string()).optional(),
  insurance_partners: z.array(z.string()).optional(),
});

export const applicationSchema = z.object({
  owner: hospitalOwnerSchema,
  hospital: hospitalSchema,
  documents: z.array(z.object({
    document_type: z.string(),
    file: z.any(),
  })).optional(),
});

export type HospitalOwnerInput = z.infer<typeof hospitalOwnerSchema>;
export type HospitalInput = z.infer<typeof hospitalSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
