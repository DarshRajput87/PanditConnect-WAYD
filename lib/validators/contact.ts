import { z } from 'zod'

export const CONTACT_SUBJECTS = ['booking', 'pandit', 'feedback', 'partnership', 'other'] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  subject: z.enum(CONTACT_SUBJECTS),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least a few words so we can help')
    .max(2000, 'Message is too long (max 2000 characters)'),
  // Honeypot — real users never fill this hidden field
  website: z.string().max(0).optional().or(z.literal('')),
})

export type ContactInput = z.infer<typeof ContactSchema>
