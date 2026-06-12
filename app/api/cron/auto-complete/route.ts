import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { completeBooking, sendReviewRequestEmail } from '@/lib/booking/complete'

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const GRACE_AFTER_CEREMONY_MS = 6 * 3_600_000

// GET /api/cron/auto-complete — daily. Completes confirmed bookings whose
// ceremony ended 6+ hours ago, so nothing stays stuck if the Pandit forgets
// to mark it complete. Sends the review request for each.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const stale = await Booking.find({
      status: 'confirmed',
      scheduledAt: { $lt: new Date(Date.now() - GRACE_AFTER_CEREMONY_MS) },
    })
      .select('panditId')
      .lean()

    let completed = 0
    for (const booking of stale) {
      const done = await completeBooking(booking._id, booking.panditId)
      if (!done) continue
      completed++
      sendReviewRequestEmail(booking._id).catch(() => {})
    }

    return NextResponse.json({ ok: true, completed })
  } catch (e) {
    console.error('[cron] auto-complete failed', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
