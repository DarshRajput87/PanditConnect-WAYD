import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getSlotAvailability, DATE_RE } from '@/lib/booking/slots'

// GET /api/bookings/slots?panditId=…&date=YYYY-MM-DD&durationMin=120
// Public — the booking wizard polls this as the customer picks a date.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const panditId = searchParams.get('panditId') ?? ''
  const date = searchParams.get('date') ?? ''
  const durationMin = parseInt(searchParams.get('durationMin') ?? '60', 10)

  if (!mongoose.isValidObjectId(panditId) || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }
  const duration = Number.isFinite(durationMin) ? Math.min(Math.max(durationMin, 15), 1440) : 60

  try {
    const day = await getSlotAvailability(panditId, date, duration)
    return NextResponse.json(
      { slots: day.slots, reason: day.reason ?? null, date, timezone: 'Asia/Kolkata' },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
    )
  } catch (e) {
    console.error('[slots] availability failed', e)
    return NextResponse.json({ error: 'Failed to load slots' }, { status: 500 })
  }
}
