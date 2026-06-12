// Razorpay SDK wrapper. Server-only — never import from client components.
// When the keys are missing (local dev), isRazorpayConfigured is false and the
// UI offers cash payment only.

import crypto from 'crypto'
import Razorpay from 'razorpay'
import { Payment } from '@/lib/db/models/Payment'

export const isRazorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)

function getClient(): Razorpay {
  if (!isRazorpayConfigured) throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function createRazorpayOrderRaw(amountPaise: number, notes: Record<string, string>) {
  const client = getClient()
  return client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `booking_${Date.now()}`,
    notes,
  })
}

/** HMAC check that the checkout callback really came from Razorpay. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * Issue a refund and mark the Payment record. Used when a slot is lost after
 * payment, when a pandit declines, and when a paid request expires.
 */
export async function refundRazorpayPayment(razorpayPaymentId: string, amountPaise: number, reason: string) {
  const client = getClient()
  const refund = await client.payments.refund(razorpayPaymentId, {
    amount: amountPaise,
    notes: { reason },
  })
  await Payment.updateOne(
    { razorpayPaymentId },
    { $set: { status: 'refunded', refundId: refund.id, refundReason: reason, refundedAt: new Date() } }
  )
  return refund
}

/**
 * Best-effort refund for a booking that can no longer happen (decline/expiry).
 * No-op for cash or already-refunded payments. Never throws.
 */
export async function refundBookingPaymentIfAny(bookingId: unknown, reason: string): Promise<void> {
  try {
    const payment = await Payment.findOne({ bookingId, method: 'razorpay', status: 'paid' })
      .select('razorpayPaymentId amount')
      .lean()
    if (!payment?.razorpayPaymentId) return
    await refundRazorpayPayment(payment.razorpayPaymentId, payment.amount, reason)
  } catch (e) {
    console.error('[razorpay] refund failed for booking', bookingId, e)
  }
}
