import { sendEmail as mailerSendEmail, isEmailConfigured as mailerIsEmailConfigured } from './email/mailer'

export const isEmailConfigured = mailerIsEmailConfigured

export const EMAIL_FROM = process.env.EMAIL_FROM || `PanditConnect <${process.env.SMTP_USER || 'noreply@panditconnect.in'}>`

export async function sendEmail(opts: {
  to: string
  subject: string
  text: string
  replyTo?: string
}) {
  const success = await mailerSendEmail({
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  })
  if (!success) {
    throw new Error('Email sending failed')
  }
}

