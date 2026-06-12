import nodemailer from 'nodemailer'

// Singleton transporter — reuse across requests
let transporter: nodemailer.Transporter | null = null

export const isEmailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
)

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,          // smtp.gmail.com
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465',  // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,        // noreply@wayd.shop
      pass: process.env.SMTP_PASS,        // app password
    },
    // Connection pool for better performance
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  })

  return transporter
}

export interface MailOptions {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  try {
    if (!isEmailConfigured) {
      console.warn('[Email Warning] SMTP not fully configured in env. Local log only:')
      console.log(`To: ${options.to}\nSubject: ${options.subject}\nText:\n${options.text}`)
      return false
    }

    const transport = getTransporter()

    await transport.sendMail({
      from: `"PanditConnect" <${process.env.SMTP_USER}>`,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html || textToHtml(options.text),
    })

    return true
  } catch (error) {
    console.error('[Email Error]', error)
    return false
  }
}

// Convert plain text to basic HTML email
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
        .header { background: #F97316; padding: 24px 32px; }
        .header-title { color: white; font-size: 18px; font-weight: 600; margin: 0; }
        .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.7; }
        .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header"><p class="header-title">🕉️ PanditConnect</p></div>
        <div class="body">${escaped}</div>
        <div class="footer">PanditConnect — Book Trusted Pandit Ji Online</div>
      </div>
    </body>
    </html>
  `
}
