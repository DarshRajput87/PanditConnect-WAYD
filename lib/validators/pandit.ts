import { z } from 'zod'

export const AddressSchema = z.object({
  line1: z.string().max(120).optional().default(''),
  city: z.string().max(60).optional().default(''),
  state: z.string().max(60).optional().default(''),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Invalid pincode')
    .or(z.literal(''))
    .optional()
    .default(''),
})

// Draft is intentionally permissive — a Pandit may save a partial profile at any step.
export const PanditDraftSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  age: z.number().int().min(18, 'Must be at least 18').max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: AddressSchema.optional(),
  sampraday: z.string().max(80).optional(),
  specialization: z.array(z.string()).max(20).optional(),
  languages: z.array(z.enum(['hi', 'gu', 'en'])).optional(),
  serviceAreas: z.array(z.string().max(40)).max(10).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  bio: z.string().max(1000).optional(),
})

export type PanditDraftInput = z.infer<typeof PanditDraftSchema>

export const MaterialSchema = z.object({
  itemName: z.string().min(1).max(80),
  quantity: z.string().min(1).max(40),
  notes: z.string().max(200).optional(),
})

export const ServiceSchema = z.object({
  catalogKey: z.string().min(1),
  name: z.string().min(1).max(80),
  price: z.number().min(100, 'Minimum price is ₹100'),
  durationMin: z.number().int().min(15).max(1440),
  description: z.string().max(300).optional(),
  materials: z.array(MaterialSchema).max(30).default([]),
})

export const ServicesSchema = z.array(ServiceSchema).max(12)
export type ServiceInput = z.infer<typeof ServiceSchema>

export const SubmitSchema = z.object({
  aadhaarLast4: z.string().length(4).regex(/^\d+$/, 'Enter the last 4 digits'),
  declarationAccepted: z.literal(true),
})
