// One-off check: confirms the SMTP_* credentials in .env.local can log in.
// Run with: pnpm tsx scripts/verify-smtp.ts
import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: parseInt(process.env.SMTP_PORT || '465') === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

transporter
  .verify()
  .then(() => {
    console.log(`SMTP OK — authenticated as ${process.env.SMTP_USER} on ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('SMTP verification failed:', err.message)
    process.exit(1)
  })
