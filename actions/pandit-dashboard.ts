'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { User } from '@/lib/db/models/User'
import { istSlotToUtc, istDateStr } from '@/lib/booking/slots'
import mongoose from 'mongoose'
import type {
  BookingSummaryDTO,
  BookingDetailDTO,
  OverviewStatsDTO,
  MonthCountDTO,
  RevenueStatsDTO,
  RevenueRowDTO,
  ServiceDTO,
  MaterialDTO,
  CalendarBookingDTO,
  PanditAvailabilityDTO,
  ReviewStatsDTO,
  ReviewDTO,
  PanditProfileSummaryDTO,
} from '@/types/dashboard'

// Populated sub-document shapes (populate() selects only these fields).
type PopUser = { name?: string; email?: string; phone?: string } | null
type PopPooja = { name?: string; price?: number; durationMin?: number } | null

async function getSessionPandit() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') throw new Error('Unauthorized')
  await connectDB()
  // lean(): this lookup runs once per dashboard action — plain object, no
  // Mongoose document hydration. Callers only read fields, never .save().
  const pandit = await Pandit.findOne({ userId: session.user.id }).lean()
  if (!pandit) throw new Error('Pandit profile not found')
  return pandit
}

function toBookingSummary(b: {
  _id: unknown
  customerId: unknown
  poojaId: unknown
  scheduledAt: Date
  address: { line1: string; city: string; state: string; pincode: string }
  status: string
  expiresAt?: Date
}): BookingSummaryDTO {
  const customer = b.customerId as PopUser
  const pooja = b.poojaId as PopPooja
  return {
    _id: String(b._id),
    customerName: customer?.name ?? 'Customer',
    poojaName: pooja?.name ?? '',
    price: pooja?.price ?? 0,
    durationMin: pooja?.durationMin ?? 60,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    status: b.status,
    expiresAt: b.expiresAt?.toISOString() ?? '',
  }
}

export async function getPanditOverviewStats(): Promise<OverviewStatsDTO | { error: true }> {
  try {
    const pandit = await getSessionPandit()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [pending, thisMonthCompleted, reviewAgg] = await Promise.all([
      Booking.countDocuments({ panditId: pandit._id, status: 'requested', expiresAt: { $gt: now } }),
      Booking.countDocuments({ panditId: pandit._id, status: 'completed', updatedAt: { $gte: startOfMonth } }),
      Review.aggregate<{ avg: number; count: number }>([
        { $match: { panditId: new mongoose.Types.ObjectId(String(pandit._id)), status: 'published' } },
        { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } },
      ]),
    ])

    return {
      totalCompleted: pandit.completedBookings ?? 0,
      thisMonthCompleted,
      pendingRequests: pending,
      avgRating: reviewAgg[0]?.avg ?? 0,
      ratingCount: reviewAgg[0]?.count ?? 0,
      // Stored as a 0–1 decimal; clamp in case legacy rows hold a 0–100 value.
      responseRate: Math.min(pandit.responseRate ?? 0, 1),
    }
  } catch {
    return { error: true }
  }
}

export async function getRecentInquiries(limit = 5): Promise<BookingSummaryDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const bookings = await Booking.find({
      panditId: pandit._id,
      status: 'requested',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('customerId poojaId scheduledAt address status expiresAt')
      .populate('customerId', 'name')
      .populate('poojaId', 'name price durationMin')
      .lean()
    return bookings.map(toBookingSummary)
  } catch {
    return []
  }
}

export async function getUpcomingBookings(limit = 5): Promise<BookingSummaryDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const bookings = await Booking.find({
      panditId: pandit._id,
      status: 'confirmed',
      scheduledAt: { $gte: new Date() },
    })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .select('customerId poojaId scheduledAt address status expiresAt')
      .populate('customerId', 'name')
      .populate('poojaId', 'name price durationMin')
      .lean()
    return bookings.map(toBookingSummary)
  } catch {
    return []
  }
}

export async function getPanditInquiries(status: string, limit = 50): Promise<BookingSummaryDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const filter: Record<string, unknown> = { panditId: pandit._id, status }
    if (status === 'requested') filter.expiresAt = { $gt: new Date() }

    const bookings = await Booking.find(filter)
      .sort(status === 'confirmed' ? { scheduledAt: 1 } : { createdAt: -1 })
      .limit(limit)
      .select('customerId poojaId scheduledAt address status expiresAt')
      .populate('customerId', 'name')
      .populate('poojaId', 'name price durationMin')
      .lean()
    return bookings.map(toBookingSummary)
  } catch {
    return []
  }
}

export async function getBookingDetail(bookingId: string): Promise<BookingDetailDTO | null> {
  try {
    const pandit = await getSessionPandit()
    if (!mongoose.isValidObjectId(bookingId)) return null
    const b = await Booking.findOne({ _id: bookingId, panditId: pandit._id })
      .select('customerId poojaId scheduledAt address status expiresAt createdAt respondedAt cancellation')
      .populate('customerId', 'name email phone')
      .populate('poojaId', 'name price durationMin')
      .lean()
    if (!b) return null
    const customer = b.customerId as unknown as PopUser
    return {
      ...toBookingSummary(b),
      customerEmail: customer?.email ?? '',
      customerPhone: customer?.phone ?? '',
      createdAt: b.createdAt.toISOString(),
      respondedAt: b.respondedAt?.toISOString(),
      cancellation: b.cancellation
        ? { reason: b.cancellation.reason, at: b.cancellation.at.toISOString() }
        : undefined,
    }
  } catch {
    return null
  }
}

export async function getMonthlyBookings(): Promise<MonthCountDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    // updatedAt is the completion timestamp proxy (status flips to completed then).
    const agg = await Booking.aggregate<{ _id: { y: number; m: number }; count: number }>([
      { $match: { panditId: new mongoose.Types.ObjectId(String(pandit._id)), status: 'completed', updatedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, count: { $sum: 1 } } },
    ])

    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const found = agg.find((a) => a._id.y === d.getFullYear() && a._id.m === d.getMonth() + 1)
      return { monthIndex: d.getMonth(), count: found?.count ?? 0 }
    })
  } catch {
    return []
  }
}

export async function getPanditRevenueStats(): Promise<RevenueStatsDTO | { error: true }> {
  try {
    const pandit = await getSessionPandit()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const completed = await Booking.find({ panditId: pandit._id, status: 'completed' })
      .select('poojaId updatedAt')
      .populate('poojaId', 'price')
      .lean()

    const priceOf = (b: { poojaId: unknown }) => (b.poojaId as PopPooja)?.price ?? 0
    const total = completed.reduce((sum, b) => sum + priceOf(b), 0)
    const thisMonth = completed
      .filter((b) => b.updatedAt >= startOfMonth)
      .reduce((sum, b) => sum + priceOf(b), 0)
    const lastMonth = completed
      .filter((b) => b.updatedAt >= startOfLastMonth && b.updatedAt < startOfMonth)
      .reduce((sum, b) => sum + priceOf(b), 0)

    return {
      total,
      thisMonth,
      monthGrowth: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
      totalCompleted: completed.length,
      avgValue: completed.length > 0 ? Math.round(total / completed.length) : 0,
    }
  } catch {
    return { error: true }
  }
}

export async function getPanditRevenueTable(limit = 20): Promise<RevenueRowDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const bookings = await Booking.find({ panditId: pandit._id, status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('customerId poojaId updatedAt')
      .populate('customerId', 'name')
      .populate('poojaId', 'name price')
      .lean()

    return bookings.map((b) => ({
      _id: String(b._id),
      customerName: (b.customerId as unknown as PopUser)?.name ?? 'Customer',
      poojaName: (b.poojaId as unknown as PopPooja)?.name ?? '',
      price: (b.poojaId as unknown as PopPooja)?.price ?? 0,
      completedAt: b.updatedAt.toISOString(),
    }))
  } catch {
    return []
  }
}

function toMaterialDTO(m: { _id: unknown; itemName: string; quantity: string; notes?: string }): MaterialDTO {
  return {
    _id: String(m._id),
    itemName: m.itemName,
    quantity: m.quantity,
    notes: m.notes || undefined,
  }
}

export async function getPanditServices(): Promise<ServiceDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const services = await Pooja.find({ panditId: pandit._id })
      .sort({ active: -1, createdAt: -1 })
      .select('catalogKey name price durationMin description active')
      .lean()

    const materials = await Material.find({ poojaId: { $in: services.map((s) => s._id) } })
      .sort({ createdAt: 1 })
      .lean()
    const materialsByPooja = new Map<string, MaterialDTO[]>()
    for (const m of materials) {
      const key = String(m.poojaId)
      const list = materialsByPooja.get(key) ?? []
      list.push(toMaterialDTO(m))
      materialsByPooja.set(key, list)
    }

    return services.map((s) => ({
      _id: String(s._id),
      catalogKey: s.catalogKey,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin,
      description: s.description ?? '',
      active: s.active,
      materials: materialsByPooja.get(String(s._id)) ?? [],
    }))
  } catch {
    return []
  }
}

export async function getPanditService(serviceId: string): Promise<ServiceDTO | null> {
  try {
    const pandit = await getSessionPandit()
    if (!mongoose.isValidObjectId(serviceId)) return null
    const s = await Pooja.findOne({ _id: serviceId, panditId: pandit._id })
      .select('catalogKey name price durationMin description active')
      .lean()
    if (!s) return null
    const materials = await Material.find({ poojaId: s._id }).sort({ createdAt: 1 }).lean()
    return {
      _id: String(s._id),
      catalogKey: s.catalogKey,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin,
      description: s.description ?? '',
      active: s.active,
      materials: materials.map(toMaterialDTO),
    }
  } catch {
    return null
  }
}

// Bookings for the calendar view of one IST month, padded a week either side
// so the weekly view renders complete edge weeks.
export async function getPanditCalendarBookings(year: number, month: number): Promise<CalendarBookingDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const pad = (n: number) => String(n).padStart(2, '0')
    const monthStart = istSlotToUtc(`${year}-${pad(month + 1)}-01`, 0)
    const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${pad(month + 2)}-01`
    const monthEnd = istSlotToUtc(nextMonth, 0)
    const WEEK_MS = 7 * 86_400_000

    const bookings = await Booking.find({
      panditId: pandit._id,
      status: { $in: ['requested', 'confirmed', 'completed'] },
      scheduledAt: { $gte: new Date(monthStart.getTime() - WEEK_MS), $lt: new Date(monthEnd.getTime() + WEEK_MS) },
    })
      .sort({ scheduledAt: 1 })
      .select('scheduledAt status customerId poojaId address')
      .populate('customerId', 'name')
      .populate('poojaId', 'name durationMin price')
      .lean()

    return bookings.map((b) => {
      const customer = b.customerId as PopUser
      const pooja = b.poojaId as PopPooja & { durationMin?: number } | null
      return {
        _id: String(b._id),
        scheduledAt: b.scheduledAt.toISOString(),
        status: b.status,
        customerName: customer?.name ?? 'Customer',
        poojaName: pooja?.name ?? '',
        durationMin: pooja?.durationMin ?? 60,
        price: pooja?.price ?? 0,
        city: b.address?.city ?? '',
      }
    })
  } catch {
    return []
  }
}

export async function getPanditAvailability(): Promise<PanditAvailabilityDTO> {
  const fallback: PanditAvailabilityDTO = {
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    workingHoursStart: '06:00',
    workingHoursEnd: '20:00',
    maxPerDay: null,
    blockedDates: [],
  }
  try {
    const pandit = await getSessionPandit()
    const av = pandit.availability
    if (!av) return fallback
    return {
      workingDays: av.workingDays?.length ? av.workingDays : fallback.workingDays,
      workingHoursStart: av.workingHoursStart || fallback.workingHoursStart,
      workingHoursEnd: av.workingHoursEnd || fallback.workingHoursEnd,
      maxPerDay: av.maxPerDay ?? null,
      blockedDates: (av.blockedDates ?? []).map((d) => istDateStr(new Date(d))),
    }
  } catch {
    return fallback
  }
}

export async function getPanditReviewStats(): Promise<ReviewStatsDTO> {
  const empty: ReviewStatsDTO = { avg: 0, count: 0, ritualKnowledge: 0, punctuality: 0, behaviour: 0, communication: 0 }
  try {
    const pandit = await getSessionPandit()
    const agg = await Review.aggregate<{
      avg: number; count: number; ritualKnowledge: number | null; punctuality: number | null
      behaviour: number | null; communication: number | null
    }>([
      { $match: { panditId: new mongoose.Types.ObjectId(String(pandit._id)), status: 'published' } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$overall' },
          count: { $sum: 1 },
          ritualKnowledge: { $avg: '$ritualKnowledge' },
          punctuality: { $avg: '$punctuality' },
          behaviour: { $avg: '$behaviour' },
          communication: { $avg: '$communication' },
        },
      },
    ])
    const r = agg[0]
    if (!r) return empty
    return {
      avg: r.avg ?? 0,
      count: r.count ?? 0,
      ritualKnowledge: r.ritualKnowledge ?? 0,
      punctuality: r.punctuality ?? 0,
      behaviour: r.behaviour ?? 0,
      communication: r.communication ?? 0,
    }
  } catch {
    return empty
  }
}

export async function getPanditReviews(limit = 20): Promise<ReviewDTO[]> {
  try {
    const pandit = await getSessionPandit()
    const reviews = await Review.find({ panditId: pandit._id, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'customerId bookingId overall ritualKnowledge punctuality behaviour communication comment createdAt panditReply status'
      )
      .populate('customerId', 'name')
      .populate({ path: 'bookingId', select: 'poojaId', populate: { path: 'poojaId', select: 'name' } })
      .lean()

    return reviews.map((r) => {
      const booking = r.bookingId as unknown as { poojaId?: { name?: string } } | null
      return {
        _id: String(r._id),
        customerName: (r.customerId as unknown as PopUser)?.name ?? 'Verified customer',
        poojaName: booking?.poojaId?.name ?? '',
        overall: r.overall,
        ritualKnowledge: r.ritualKnowledge,
        punctuality: r.punctuality,
        behaviour: r.behaviour,
        communication: r.communication,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        panditReply: r.panditReply?.text
          ? { text: r.panditReply.text, at: r.panditReply.at.toISOString() }
          : undefined,
        status: r.status,
      }
    })
  } catch {
    return []
  }
}

export async function getPanditProfileSummary(): Promise<PanditProfileSummaryDTO | null> {
  try {
    const pandit = await getSessionPandit()
    const [user, servicesCount] = await Promise.all([
      User.findById(pandit.userId).select('name email phone').lean(),
      Pooja.countDocuments({ panditId: pandit._id, active: true }),
    ])
    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      profilePhoto: pandit.profilePhoto ?? '',
      bio: pandit.bio ?? '',
      sampraday: pandit.sampraday ?? '',
      specialization: pandit.specialization ?? [],
      languages: pandit.languages ?? [],
      serviceAreas: pandit.serviceAreas ?? [],
      experienceYears: pandit.experienceYears ?? 0,
      address: pandit.address,
      verificationStatus: pandit.verificationStatus,
      rejectionReason: pandit.rejectionReason,
      hasIdDocument: Boolean(pandit.idDocumentUrl),
      servicesCount,
      ratingAvg: pandit.ratingAvg ?? 0,
      ratingCount: pandit.ratingCount ?? 0,
    }
  } catch {
    return null
  }
}
