import nodemailer from 'nodemailer'

// Single SMTP transport shared by every server-side email sender.
// Configured via SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS; when those are
// missing (e.g. local dev), `mailer` is null and callers fall back to logging.
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465, // SSL on 465, STARTTLS otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

export const EMAIL_FROM = process.env.EMAIL_FROM || `PanditConnect <${process.env.SMTP_USER || 'noreply@panditconnect.in'}>`

export const isEmailConfigured = smtpConfigured

export async function sendEmail(opts: {
  to: string
  subject: string
  text: string
  replyTo?: string
}) {
  if (!transporter) {
    throw new Error('SMTP not configured — set SMTP_HOST/SMTP_USER/SMTP_PASS')
  }
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  })
}
