import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
import { User } from '@/lib/db/models/User'
import { refundBookingPaymentIfAny } from '@/lib/payments/razorpay'
import { sendBookingExpiredToCustomer } from '@/lib/notifications/email'

export const maxDuration = 60

// Vercel cron sends "Authorization: Bearer <CRON_SECRET>" automatically.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// Recompute response rate after expiries — same formula as actions/booking.ts.
async function refreshResponseRate(panditId: unknown) {
  const [responded, expired] = await Promise.all([
    Booking.countDocuments({ panditId, respondedAt: { $exists: true } }),
    Booking.countDocuments({ panditId, status: 'expired' }),
  ])
  const denominator = responded + expired
  const rate = denominator > 0 ? responded / denominator : 0
  await Pandit.updateOne({ _id: panditId }, { $set: { responseRate: rate } })
}

// notifyCustomerExpired helper removed in favor of direct call to sendBookingExpiredToCustomer.

// GET /api/cron/expire-bookings — expires overdue requests, refunds paid
// online payments and notifies customers. Safe to run repeatedly.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const overdue = await Booking.find({ status: 'requested', expiresAt: { $lt: new Date() } })
      .select('panditId customerId')
      .lean()

    const affectedPandits = new Set<string>()
    let expired = 0

    for (const booking of overdue) {
      // Conditional update keeps this idempotent under concurrent runs.
      const res = await Booking.updateOne(
        { _id: booking._id, status: 'requested' },
        { $set: { status: 'expired' } }
      )
      if (res.modifiedCount === 0) continue
      expired++
      affectedPandits.add(String(booking.panditId))

      await refundBookingPaymentIfAny(booking._id, 'Booking expired — Pandit did not respond')
      sendBookingExpiredToCustomer(String(booking._id)).catch(() => {})
    }

    for (const panditId of affectedPandits) {
      await refreshResponseRate(panditId)
    }

    return NextResponse.json({ ok: true, expired })
  } catch (e) {
    console.error('[cron] expire-bookings failed', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
