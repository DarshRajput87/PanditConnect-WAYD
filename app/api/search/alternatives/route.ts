import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { getSlotAvailability, DATE_RE } from '@/lib/booking/slots'

// GET /api/search/alternatives?catalogKey=…&date=…&time=HH:00&excludePanditId=…&ratingAvg=…&experienceYears=…
// Suggests up to 3 similar verified pandits who are free at the requested slot.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const catalogKey = searchParams.get('catalogKey') ?? ''
  const date = searchParams.get('date') ?? ''
  const time = searchParams.get('time') ?? ''
  const excludePanditId = searchParams.get('excludePanditId') ?? ''
  const ratingAvg = Number(searchParams.get('ratingAvg') ?? '0')
  const experienceYears = Number(searchParams.get('experienceYears') ?? '0')

  if (!catalogKey || !DATE_RE.test(date) || !/^\d{2}:00$/.test(time)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  try {
    await connectDB()

    // Same pooja offered by other pandits.
    const poojaFilter: Record<string, unknown> = { catalogKey, active: true }
    if (mongoose.isValidObjectId(excludePanditId)) {
      poojaFilter.panditId = { $ne: new mongoose.Types.ObjectId(excludePanditId) }
    }
    const poojas = await Pooja.find(poojaFilter).select('panditId price durationMin').lean()
    if (poojas.length === 0) return NextResponse.json({ alternatives: [] })

    const poojaByPandit = new Map(poojas.map((p) => [String(p.panditId), p]))

    const panditFilter: Record<string, unknown> = {
      _id: { $in: [...poojaByPandit.keys()].map((id) => new mongoose.Types.ObjectId(id)) },
      verificationStatus: 'verified',
    }
    if (ratingAvg > 0) panditFilter.ratingAvg = { $gte: ratingAvg - 1, $lte: ratingAvg + 1 }
    if (experienceYears > 0) {
      panditFilter.experienceYears = { $gte: Math.max(0, experienceYears - 5), $lte: experienceYears + 5 }
    }

    const candidates = await Pandit.find(panditFilter)
      .sort({ ratingWeighted: -1, completedBookings: -1 })
      .limit(10)
      .select('userId profilePhoto ratingAvg ratingCount experienceYears')
      .populate<{ userId: { name?: string } }>('userId', 'name')
      .lean()

    // Keep only those actually free at the requested slot (max 3).
    const alternatives: Array<{
      _id: string
      name: string
      profilePhoto: string
      ratingAvg: number
      ratingCount: number
      experienceYears: number
      price: number
      poojaId: string
    }> = []

    for (const p of candidates) {
      if (alternatives.length >= 3) break
      const pooja = poojaByPandit.get(String(p._id))
      if (!pooja) continue
      const day = await getSlotAvailability(String(p._id), date, pooja.durationMin ?? 60)
      if (!day.slots.find((s) => s.time === time)?.available) continue
      alternatives.push({
        _id: String(p._id),
        name: p.userId?.name ?? 'Pandit Ji',
        profilePhoto: p.profilePhoto ?? '',
        ratingAvg: p.ratingAvg ?? 0,
        ratingCount: p.ratingCount ?? 0,
        experienceYears: p.experienceYears ?? 0,
        price: pooja.price,
        poojaId: String(pooja._id),
      })
    }

    return NextResponse.json({ alternatives })
  } catch (e) {
    console.error('[alternatives] search failed', e)
    return NextResponse.json({ error: 'Failed to find alternatives' }, { status: 500 })
  }
}
