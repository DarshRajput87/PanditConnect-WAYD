import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().min(8).max(64),
  role: z.enum(['customer', 'pandit']),
  preferredLanguage: z.enum(['hi', 'gu', 'en']).default('en'),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const OTPVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/),
})

// Completes a Google (OAuth) sign-up: the role comes from the register toggle and
// the mobile number is collected on the /complete-profile step.
export const CompleteProfileSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  role: z.enum(['customer', 'pandit']),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type OTPVerifyInput = z.infer<typeof OTPVerifySchema>
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>
