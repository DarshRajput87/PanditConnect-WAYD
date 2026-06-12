// Shared side effects for completing a booking — used by the pandit's
// "mark complete" action and the nightly auto-complete cron.

import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
import { Payment } from '@/lib/db/models/Payment'
import { sendEmail, isEmailConfigured } from '@/lib/email/mailer'
import { sendReviewRequestToCustomer } from '@/lib/notifications/email'

/**
 * Flip a confirmed booking to completed. Returns false if someone else
 * completed/changed it first (conditional update keeps this idempotent).
 */
export async function completeBooking(bookingId: unknown, panditId: unknown): Promise<boolean> {
  const res = await Booking.updateOne(
    { _id: bookingId, status: 'confirmed' },
    { $set: { status: 'completed', completedAt: new Date() } }
  )
  if (res.modifiedCount === 0) return false

  await Promise.all([
    Pandit.updateOne({ _id: panditId }, { $inc: { completedBookings: 1 }, $set: { lastActiveAt: new Date() } }),
    // Cash is collected at the ceremony — completion settles it.
    Payment.updateOne(
      { bookingId, method: 'cash', status: 'pending' },
      { $set: { status: 'paid', paidAt: new Date() } }
    ),
  ])
  return true
}

/** "How was your pooja?" email with a deep link to the review form. Never throws. */
export async function sendReviewRequestEmail(bookingId: unknown): Promise<void> {
  await sendReviewRequestToCustomer(String(bookingId))
}

/** One-time review reminder, 3 days after completion. */
export async function sendReviewReminderEmail(bookingId: unknown): Promise<void> {
  if (!isEmailConfigured) return
  try {
    const booking = await Booking.findById(bookingId)
      .select('customerId poojaId')
      .populate<{ customerId: { email?: string } | null }>('customerId', 'email')
      .populate<{ poojaId: { name?: string } | null }>('poojaId', 'name')
      .lean()
    const to = booking?.customerId?.email
    if (!booking || !to) return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await sendEmail({
      to,
      subject: `A quick reminder — review your ${booking.poojaId?.name ?? 'pooja'}`,
      text: `Your recent pooja booked via PanditConnect is waiting for a review. Sharing your experience helps other devotees choose with confidence:\n${appUrl}/dashboard/customer/bookings/${String(booking._id)}/review\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.warn('[booking] review reminder email failed', e)
  }
}
