'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { sendEmail, isEmailConfigured } from '@/lib/email/mailer'
import { refundBookingPaymentIfAny } from '@/lib/payments/razorpay'
import { completeBooking } from '@/lib/booking/complete'
import {
  sendBookingConfirmedToCustomer,
  sendBookingDeclinedToCustomer,
  sendReviewRequestToCustomer,
} from '@/lib/notifications/email'
import { z } from 'zod'
import mongoose from 'mongoose'

// Short, translatable error codes (resolved client-side via t(`panditDash.errors.<code>`)).
type BookingErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'invalid_state'
  | 'request_expired'
  | 'invalid_input'
  | 'server'
export type BookingActionResult = { error: { code: BookingErrorCode } } | { success: true }

const CancelReasonSchema = z.string().trim().min(5).max(200)

async function getSessionPandit() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return null
  await connectDB()
  // Callers only need the _id for ownership checks.
  return Pandit.findOne({ userId: session.user.id }).select('_id').lean()
}

async function notifyParty(bookingId: string, party: 'customer' | 'pandit', subject: string, text: string) {
  if (!isEmailConfigured) {
    console.info(`[booking][dev] email skipped (SMTP not configured): ${subject}`)
    return
  }
  try {
    let to: string | undefined
    if (party === 'customer') {
      const booking = await Booking.findById(bookingId)
        .populate<{ customerId: { email?: string } }>('customerId', 'email')
        .lean()
      to = booking?.customerId?.email
    } else {
      const booking = await Booking.findById(bookingId)
        .populate<{ panditId: { userId?: { email?: string } } }>({
          path: 'panditId',
          select: 'userId',
          populate: { path: 'userId', select: 'email' },
        })
        .lean()
      to = booking?.panditId?.userId?.email
    }
    if (!to) return
    await sendEmail({ to, subject, text })
  } catch (e) {
    // Notification failure must never fail the booking state change.
    console.warn('[booking] notification failed', e)
  }
}

const notifyCustomer = (bookingId: string, subject: string, text: string) =>
  notifyParty(bookingId, 'customer', subject, text)

// Recompute the Pandit's response rate: answered requests over all requests that
// reached a terminal "was it answered in time?" outcome (responded or expired).
async function refreshResponseRate(panditId: unknown) {
  const [responded, expired] = await Promise.all([
    Booking.countDocuments({ panditId, respondedAt: { $exists: true } }),
    Booking.countDocuments({ panditId, status: 'expired' }),
  ])
  const denominator = responded + expired
  const rate = denominator > 0 ? responded / denominator : 0
  await Pandit.updateOne({ _id: panditId }, { $set: { responseRate: rate } })
}

export async function respondToBooking(
  bookingId: string,
  action: 'accept' | 'decline'
): Promise<BookingActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }

    const booking = await Booking.findOne({ _id: bookingId, panditId: pandit._id })
    if (!booking) return { error: { code: 'not_found' } }
    if (booking.status !== 'requested') return { error: { code: 'invalid_state' } }

    if (booking.expiresAt.getTime() <= Date.now()) {
      booking.status = 'expired'
      await booking.save()
      await refreshResponseRate(pandit._id)
      return { error: { code: 'request_expired' } }
    }

    booking.status = action === 'accept' ? 'confirmed' : 'declined'
    booking.respondedAt = new Date()
    await booking.save()
    await refreshResponseRate(pandit._id)

    // Online payments are refunded in full when the pandit declines.
    if (action === 'decline') {
      await refundBookingPaymentIfAny(booking._id, 'Pandit declined booking')
    }

    if (action === 'accept') {
      await sendBookingConfirmedToCustomer(bookingId)
    } else {
      await sendBookingDeclinedToCustomer(bookingId)
    }
    return { success: true }
  } catch (e) {
    console.error('[booking] respondToBooking failed', e)
    return { error: { code: 'server' } }
  }
}

export async function markBookingCompleted(bookingId: string): Promise<BookingActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }

    const booking = await Booking.findOne({ _id: bookingId, panditId: pandit._id })
    if (!booking) return { error: { code: 'not_found' } }
    if (booking.status !== 'confirmed') return { error: { code: 'invalid_state' } }
    // The ceremony must already have happened.
    if (booking.scheduledAt.getTime() > Date.now()) return { error: { code: 'invalid_state' } }

    const completed = await completeBooking(booking._id, pandit._id)
    if (!completed) return { error: { code: 'invalid_state' } }

    // Fire-and-forget: the review nudge must never block completion.
    sendReviewRequestToCustomer(String(booking._id)).catch(() => {})
    return { success: true }
  } catch (e) {
    console.error('[booking] markBookingCompleted failed', e)
    return { error: { code: 'server' } }
  }
}

// Both parties can cancel: a pandit may cancel a confirmed booking; a customer
// may withdraw a pending request or cancel a confirmed booking. The other party
// is notified by email.
export async function cancelBooking(bookingId: string, reason: string): Promise<BookingActionResult> {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'pandit' && session.user.role !== 'customer')) {
      return { error: { code: 'unauthorized' } }
    }

    const parsed = CancelReasonSchema.safeParse(reason)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    await connectDB()

    let booking
    let cancellableStatuses: string[]
    if (session.user.role === 'pandit') {
      const pandit = await Pandit.findOne({ userId: session.user.id }).select('_id').lean()
      if (!pandit) return { error: { code: 'unauthorized' } }
      booking = await Booking.findOne({ _id: bookingId, panditId: pandit._id })
      cancellableStatuses = ['confirmed']
    } else {
      booking = await Booking.findOne({ _id: bookingId, customerId: session.user.id })
      cancellableStatuses = ['requested', 'confirmed']
    }

    if (!booking) return { error: { code: 'not_found' } }
    if (!cancellableStatuses.includes(booking.status)) return { error: { code: 'invalid_state' } }

    booking.status = 'cancelled'
    booking.cancellation = {
      by: new mongoose.Types.ObjectId(session.user.id),
      reason: parsed.data,
      at: new Date(),
    }
    await booking.save()

    // The ceremony is off — return any online payment in full.
    await refundBookingPaymentIfAny(booking._id, 'Booking cancelled')

    if (session.user.role === 'pandit') {
      await notifyCustomer(
        bookingId,
        'Your booking was cancelled',
        `Your Pandit Ji had to cancel the booking. Reason: ${parsed.data}. You can rebook with another verified Pandit on PanditConnect.`
      )
    } else {
      await notifyParty(
        bookingId,
        'pandit',
        'A booking was cancelled',
        `The customer cancelled a booking. Reason: ${parsed.data}. See your PanditConnect dashboard for details.`
      )
    }
    return { success: true }
  } catch (e) {
    console.error('[booking] cancelBooking failed', e)
    return { error: { code: 'server' } }
  }
}
