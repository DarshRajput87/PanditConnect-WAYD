import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
import { sendReviewReminderEmail } from '@/lib/booking/complete'

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const REMINDER_AFTER_MS = 3 * 86_400_000

// GET /api/cron/review-reminder — daily. One reminder per booking, 3 days
// after completion, only when no review exists yet.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const cutoff = new Date(Date.now() - REMINDER_AFTER_MS)
    const candidates = await Booking.find({
      status: 'completed',
      reviewReminderSent: { $ne: true },
      // Legacy completed bookings (before completedAt existed) fall back to updatedAt.
      $or: [{ completedAt: { $lte: cutoff } }, { completedAt: null, updatedAt: { $lte: cutoff } }],
    })
      .select('_id')
      .limit(200)
      .lean()

    let sent = 0
    for (const booking of candidates) {
      const reviewed = await Review.exists({ bookingId: booking._id })
      // Flag first so a crash can't cause duplicate reminders later.
      const res = await Booking.updateOne(
        { _id: booking._id, reviewReminderSent: { $ne: true } },
        { $set: { reviewReminderSent: true } }
      )
      if (res.modifiedCount === 0) continue
      if (reviewed) continue
      await sendReviewReminderEmail(booking._id)
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    console.error('[cron] review-reminder failed', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
