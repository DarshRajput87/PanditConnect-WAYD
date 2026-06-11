'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { RegisterSchema, OTPVerifySchema, CompleteProfileSchema } from '@/lib/validators/auth'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import type { Role } from '@/types'

// Explicit, discriminated result types keep client-side narrowing precise.
type RegisterResult =
  | { error: Record<string, string[] | undefined> }
  | { success: true; email: string }
// Short, translatable error codes (resolved client-side via t(`auth.errors.<code>`)).
type VerifyErrorCode = 'invalid_input' | 'not_found' | 'max_attempts' | 'expired' | 'invalid_otp'
type VerifyResult =
  | { error: { code: VerifyErrorCode; remaining?: number } }
  | { success: true; role: Role }
type ResendResult = { error: string } | { success: true }
type CompleteResult = { error: string } | { success: true; role: Role }

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5')

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOtpEmail(to: string, otp: string, subject: string) {
  if (!resend) {
    // Email provider not configured (e.g. local dev without RESEND_API_KEY).
    // Skip the send so the flow does not crash; configure RESEND_API_KEY to enable.
    if (process.env.NODE_ENV !== 'production') {
      // Dev convenience only: print the OTP so the verify flow is testable locally.
      console.info(`[auth][dev] OTP for ${to}: ${otp}`)
    } else {
      console.warn('[auth] RESEND_API_KEY not set — OTP email skipped for', to)
    }
    return
  }
  await resend.emails.send({
    from: 'PanditConnect <noreply@panditconnect.in>',
    to,
    subject,
    text: `Your OTP is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || '10'} minutes.`,
  })
}

export async function registerUser(formData: unknown): Promise<RegisterResult> {
  const parsed = RegisterSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  const { name, email, phone, password, role, preferredLanguage } = parsed.data

  // Check duplicates — never reveal which field matched
  const exists = await User.findOne({ $or: [{ email }, { phone }] }).lean()
  if (exists) return { error: { _form: ['duplicate'] } }

  const passwordHash = await bcrypt.hash(password, 12)
  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    preferredLanguage,
    status: 'pending',
    otpHash,
    otpExpiry: new Date(Date.now() + OTP_EXPIRY),
    otpAttempts: 0,
  })

  // Create an empty pandit draft profile if the role is pandit.
  if (role === 'pandit') {
    try {
      await Pandit.create({ userId: user._id })
    } catch (err) {
      // Roll back the half-created account so the email/phone aren't orphaned.
      await User.deleteOne({ _id: user._id })
      console.error('Pandit skeleton creation failed', err)
      return { error: { _form: ['server'] } }
    }
  }

  // Send OTP email — fire and forget
  sendOtpEmail(email, otp, 'Verify your PanditConnect account').catch(console.error)

  return { success: true, email }
}

export async function verifyOTP(formData: unknown): Promise<VerifyResult> {
  const parsed = OTPVerifySchema.safeParse(formData)
  if (!parsed.success) return { error: { code: 'invalid_input' } }

  await connectDB()
  const user = await User.findOne({ email: parsed.data.email })
  if (!user) return { error: { code: 'not_found' } }

  if (user.otpAttempts >= MAX_ATTEMPTS) return { error: { code: 'max_attempts' } }
  if (!user.otpExpiry || user.otpExpiry < new Date()) return { error: { code: 'expired' } }

  const valid = await bcrypt.compare(parsed.data.otp, user.otpHash || '')
  if (!valid) {
    const attempts = user.otpAttempts + 1
    await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } })
    // Once the cap is hit, surface the locked state so the client disables input.
    if (attempts >= MAX_ATTEMPTS) return { error: { code: 'max_attempts' } }
    return { error: { code: 'invalid_otp', remaining: MAX_ATTEMPTS - attempts } }
  }

  await User.updateOne(
    { _id: user._id },
    {
      emailVerified: true,
      status: 'active',
      $unset: { otpHash: 1, otpExpiry: 1 },
      otpAttempts: 0,
    }
  )
  return { success: true, role: user.role }
}

// Finishes a Google sign-up. The OAuth session already proves the email; here we
// attach the role (from the register toggle) and the mobile number, then create the
// User (Google accounts are email-verified, so status goes straight to 'active').
export async function completeGoogleProfile(input: unknown): Promise<CompleteResult> {
  const session = await auth()
  if (!session?.user?.email) return { error: 'unauthorized' }

  const parsed = CompleteProfileSchema.safeParse(input)
  if (!parsed.success) return { error: 'invalid' }
  const { phone, role } = parsed.data

  await connectDB()

  // Mobile number must stay unique across all users.
  const phoneTaken = await User.findOne({ phone, email: { $ne: session.user.email } }).lean()
  if (phoneTaken) return { error: 'phone_taken' }

  // An account may already exist (e.g. they previously registered with email/password
  // using the same address) — link to it rather than duplicating.
  const existing = await User.findOne({ email: session.user.email })
  if (existing) {
    if (existing.phone) return { success: true, role: existing.role } // already complete
    existing.phone = phone
    if (!existing.role) existing.role = role
    existing.status = 'active'
    existing.emailVerified = true
    await existing.save()
    if (existing.role === 'pandit') {
      await Pandit.updateOne(
        { userId: existing._id },
        { $setOnInsert: { userId: existing._id } },
        { upsert: true }
      )
    }
    return { success: true, role: existing.role }
  }

  let user
  try {
    user = await User.create({
      name: session.user.name || 'PanditConnect user',
      email: session.user.email,
      phone,
      role,
      preferredLanguage: 'en',
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
    })
  } catch (err) {
    console.error('Google profile completion failed', err)
    return { error: 'server' }
  }

  // Mirror credentials registration: pandits get an empty draft profile.
  if (role === 'pandit') {
    try {
      await Pandit.create({ userId: user._id })
    } catch (err) {
      await User.deleteOne({ _id: user._id })
      console.error('Pandit skeleton creation failed', err)
      return { error: 'server' }
    }
  }

  return { success: true, role }
}

export async function resendOTP(email: string): Promise<ResendResult> {
  await connectDB()
  const user = await User.findOne({ email, status: 'pending' })
  if (!user) return { error: 'Account not found or already verified' }

  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)
  await User.updateOne(
    { _id: user._id },
    { otpHash, otpExpiry: new Date(Date.now() + OTP_EXPIRY), otpAttempts: 0 }
  )

  await sendOtpEmail(email, otp, 'New OTP — PanditConnect')
  return { success: true }
}
