import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function test() {
  const { sendEmail } = await import('../lib/email/mailer')

  console.log('Testing SMTP connection...')
  console.log('Host:', process.env.SMTP_HOST)
  console.log('Port:', process.env.SMTP_PORT)
  console.log('User:', process.env.SMTP_USER)
  console.log('Pass set:', !!process.env.SMTP_PASS)

  const result = await sendEmail({
    to: 'darshraj3104@gmail.com',
    subject: 'PanditConnect Email Test',
    text: 'If you receive this email, SMTP is configured correctly!',
  })

  console.log(result ? '✅ Email sent successfully!' : '❌ Email failed — check SMTP credentials')
  process.exit(0)
}

test().catch(console.error)


