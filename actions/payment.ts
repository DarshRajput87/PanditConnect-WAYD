'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Booking } from '@/lib/db/models/Booking'
import { Payment } from '@/lib/db/models/Payment'
import { sendEmail, isEmailConfigured } from '@/lib/email/mailer'
import { sendBookingRequestToPanel } from '@/lib/notifications/email'
import { checkSlotBookable } from '@/lib/booking/slots'
import {
  isRazorpayConfigured,
  createRazorpayOrderRaw,
  verifyPaymentSignature,
  refundRazorpayPayment,
} from '@/lib/payments/razorpay'
import mongoose from 'mongoose'
import { z } from 'zod'

export type PaymentErrorCode =
  | 'unauthorized'
  | 'invalid_input'
  | 'not_found'
  | 'slot_taken'
  | 'slot_taken_refund'
  | 'payment_failed'
  | 'not_configured'
  | 'server'

export type CreateBookingResult = { error: { code: PaymentErrorCode } } | { success: true; bookingId: string }
export type CreateOrderResult =
  | { error: { code: PaymentErrorCode } }
  | { success: true; orderId: string; amount: number; currency: string; keyId: string }

const RESPONSE_SLA_MS = 2 * 3_600_000 // pandit has 2 hours to respond

const BookingFormSchema = z.object({
  panditId: z.string().refine(mongoose.isValidObjectId),
  poojaId: z.string().refine(mongoose.isValidObjectId),
  scheduledAt: z.string().datetime(),
  address: z.object({
    line1: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/),
  }),
})
export type BookingFormInput = z.infer<typeof BookingFormSchema>

interface ValidatedBooking {
  customerId: string
  panditId: string
  poojaId: string
  poojaName: string
  panditUserId: string
  scheduledAt: Date
  price: number
  durationMin: number
  address: BookingFormInput['address']
}

// All the state-machine checks the wizard cannot be trusted with:
// customer active, pandit verified, pooja active + owned, slot genuinely free.
async function validateBookingRequest(
  input: unknown
): Promise<{ ok: true; data: ValidatedBooking } | { ok: false; code: PaymentErrorCode }> {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { ok: false, code: 'unauthorized' }

  const parsed = BookingFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: 'invalid_input' }
  const data = parsed.data

  await connectDB()

  const [customer, pandit, pooja] = await Promise.all([
    User.findById(session.user.id).select('status').lean(),
    Pandit.findById(data.panditId).select('verificationStatus userId').lean(),
    Pooja.findOne({ _id: data.poojaId, panditId: data.panditId, active: true })
      .select('name price durationMin')
      .lean(),
  ])

  if (!customer || customer.status !== 'active') return { ok: false, code: 'unauthorized' }
  if (!pandit || pandit.verificationStatus !== 'verified') return { ok: false, code: 'not_found' }
  if (!pooja) return { ok: false, code: 'not_found' }

  const scheduledAt = new Date(data.scheduledAt)
  const slot = await checkSlotBookable(data.panditId, scheduledAt, pooja.durationMin)
  if (!slot.ok) return { ok: false, code: slot.code === 'invalid_slot' ? 'invalid_input' : 'slot_taken' }

  return {
    ok: true,
    data: {
      customerId: session.user.id,
      panditId: data.panditId,
      poojaId: data.poojaId,
      poojaName: pooja.name,
      panditUserId: String(pandit.userId),
      scheduledAt,
      price: pooja.price,
      durationMin: pooja.durationMin,
      address: data.address,
    },
  }
}

function isDuplicateKeyError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000
}

async function createBookingWithPayment(
  v: ValidatedBooking,
  paymentMethod: 'cash' | 'razorpay',
  paymentFields: Partial<{
    status: 'pending' | 'paid'
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
    paidAt: Date
  }>
): Promise<{ bookingId: string } | { duplicate: true }> {
  let booking
  try {
    booking = await Booking.create({
      customerId: v.customerId,
      panditId: v.panditId,
      poojaId: v.poojaId,
      scheduledAt: v.scheduledAt,
      timezone: 'Asia/Kolkata',
      address: v.address,
      status: 'requested',
      paymentMethod,
      expiresAt: new Date(Date.now() + RESPONSE_SLA_MS),
    })
  } catch (e) {
    // Unique (panditId, scheduledAt) index — someone won the race for this slot.
    if (isDuplicateKeyError(e)) return { duplicate: true }
    throw e
  }

  await Payment.create({
    bookingId: booking._id,
    customerId: v.customerId,
    panditId: v.panditId,
    amount: v.price * 100, // paise
    method: paymentMethod,
    status: paymentFields.status ?? 'pending',
    razorpayOrderId: paymentFields.razorpayOrderId,
    razorpayPaymentId: paymentFields.razorpayPaymentId,
    razorpaySignature: paymentFields.razorpaySignature,
    paidAt: paymentFields.paidAt,
  })

  sendBookingRequestToPanel(String(booking._id)).catch((e) => console.warn('[payment] pandit notification failed', e))
  return { bookingId: String(booking._id) }
}

// ---------------- Flow A: cash on ceremony ----------------

export async function createCashBooking(input: unknown): Promise<CreateBookingResult> {
  try {
    const validated = await validateBookingRequest(input)
    if (!validated.ok) return { error: { code: validated.code } }

    const result = await createBookingWithPayment(validated.data, 'cash', { status: 'pending' })
    if ('duplicate' in result) return { error: { code: 'slot_taken' } }
    return { success: true, bookingId: result.bookingId }
  } catch (e) {
    console.error('[payment] createCashBooking failed', e)
    return { error: { code: 'server' } }
  }
}

// ---------------- Flow B: Razorpay ----------------

// Step 1: validate everything and create a Razorpay order. No booking exists yet.
export async function createRazorpayOrder(input: unknown): Promise<CreateOrderResult> {
  try {
    if (!isRazorpayConfigured) return { error: { code: 'not_configured' } }

    const validated = await validateBookingRequest(input)
    if (!validated.ok) return { error: { code: validated.code } }
    const v = validated.data

    const order = await createRazorpayOrderRaw(v.price * 100, {
      customerId: v.customerId,
      panditId: v.panditId,
      poojaId: v.poojaId,
      scheduledAt: v.scheduledAt.toISOString(),
    })

    return {
      success: true,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID!,
    }
  } catch (e) {
    console.error('[payment] createRazorpayOrder failed', e)
    return { error: { code: 'server' } }
  }
}

// Step 2: checkout succeeded — verify the signature, re-check the slot and
// create the booking. If the slot was lost while paying, refund immediately.
export async function confirmRazorpayBooking(data: {
  bookingFormData: unknown
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): Promise<CreateBookingResult> {
  try {
    if (!isRazorpayConfigured) return { error: { code: 'not_configured' } }

    const session = await auth()
    if (!session || session.user.role !== 'customer') return { error: { code: 'unauthorized' } }

    // CRITICAL: reject forged "payment success" callbacks before anything else.
    if (
      !data.razorpayOrderId ||
      !data.razorpayPaymentId ||
      !data.razorpaySignature ||
      !verifyPaymentSignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature)
    ) {
      return { error: { code: 'payment_failed' } }
    }

    // Idempotency: the same payment can only ever produce one booking.
    await connectDB()
    const existing = await Payment.findOne({ razorpayPaymentId: data.razorpayPaymentId })
      .select('bookingId')
      .lean()
    if (existing) return { success: true, bookingId: String(existing.bookingId) }

    const validated = await validateBookingRequest(data.bookingFormData)

    if (!validated.ok) {
      if (validated.code === 'slot_taken') {
        // Paid but the slot vanished — refund in full, immediately.
        const parsed = BookingFormSchema.safeParse(data.bookingFormData)
        const pooja = parsed.success
          ? await Pooja.findById(parsed.data.poojaId).select('price').lean()
          : null
        if (pooja) {
          await refundRazorpayPayment(data.razorpayPaymentId, pooja.price * 100, 'Slot unavailable after payment')
        }
        return { error: { code: 'slot_taken_refund' } }
      }
      return { error: { code: validated.code } }
    }

    const result = await createBookingWithPayment(validated.data, 'razorpay', {
      status: 'paid',
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      paidAt: new Date(),
    })
    if ('duplicate' in result) {
      await refundRazorpayPayment(
        data.razorpayPaymentId,
        validated.data.price * 100,
        'Slot unavailable after payment'
      )
      return { error: { code: 'slot_taken_refund' } }
    }
    return { success: true, bookingId: result.bookingId }
  } catch (e) {
    console.error('[payment] confirmRazorpayBooking failed', e)
    return { error: { code: 'server' } }
  }
}

// Exposed so the booking wizard can hide the online option when keys are absent.
export async function getRazorpayAvailability(): Promise<boolean> {
  return isRazorpayConfigured
}
