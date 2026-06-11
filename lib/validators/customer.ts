import { z } from 'zod'

// Default saved address collected during customer onboarding (and reused to prefill
// the Phase-4 booking address). Mirrors the booking address shape.
export const CustomerAddressSchema = z.object({
  line1: z.string().min(3, 'Enter your address').max(120),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
})

export type CustomerAddressInput = z.infer<typeof CustomerAddressSchema>
