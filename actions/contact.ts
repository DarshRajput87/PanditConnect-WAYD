'use server'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { ContactSchema } from '@/lib/validators/contact'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@panditconnect.in'

type ContactResult = { error: Record<string, string[] | undefined> } | { success: true }

export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { name, email, subject, message, website } = parsed.data

  // Honeypot tripped — pretend success so bots learn nothing
  if (website) return { success: true }

  // Same fallback pattern as the OTP sender: without SMTP config (local dev)
  // the message is logged instead of emailed and the form still works.
  if (!isEmailConfigured) {
    console.warn('[contact] SMTP not configured — message logged, not emailed')
    console.log(`[contact] from ${name} <${email}> (${subject}):\n${message}`)
    return { success: true }
  }

  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Contact: ${subject}] ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${subject}\n\n${message}`,
    })
    return { success: true }
  } catch (err) {
    console.error('[contact] send failed', err)
    return {
      error: { _form: ['Something went wrong sending your message. Please try again, or email us directly.'] },
    }
  }
}
