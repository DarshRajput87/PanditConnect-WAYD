'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
// Side-effect import: registers the Pooja model so .populate('poojaId', …) works.
import '@/lib/db/models/Pooja'
import { searchVerifiedPanditsCached } from '@/lib/db/search'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { z } from 'zod'
import type {
  CustomerStatsDTO,
  CustomerBookingDTO,
  CustomerBookingDetailDTO,
  SuggestedPanditDTO,
  PanditSearchResultDTO,
  CustomerReviewDTO,
  BookingForReviewDTO,
  CustomerSettingsDTO,
} from '@/types/dashboard'

type SettingsErrorCode = 'invalid_input' | 'wrong_password' | 'no_password' | 'server'
export type SettingsResult = { error: { code: SettingsErrorCode } } | { success: true }

// Populated sub-document shapes.
type PopPanditWithUser = { _id?: unknown; sampraday?: string; experienceYears?: number; userId?: { name?: string } } | null
type PopPooja = { name?: string; price?: number } | null

async function getCustomerId() {
  const session = await auth()
  if (!session || session.user.role !== 'customer') throw new Error('Unauthorized')
  await connectDB()
  return session.user.id
}

function toCustomerBooking(
  b: { _id: unknown; panditId: unknown; poojaId: unknown; scheduledAt: Date; status: string },
  reviewedSet: Set<string>
): CustomerBookingDTO {
  const pandit = b.panditId as PopPanditWithUser
  const pooja = b.poojaId as PopPooja
  return {
    _id: String(b._id),
    panditName: pandit?.userId?.name ?? 'Pandit Ji',
    poojaName: pooja?.name ?? '',
    price: pooja?.price ?? 0,
    scheduledAt: b.scheduledAt.toISOString(),
    status: b.status,
    hasReview: reviewedSet.has(String(b._id)),
  }
}

async function getReviewedBookingIds(customerId: string): Promise<Set<string>> {
  const ids = await Review.distinct('bookingId', { customerId })
  return new Set(ids.map((id) => String(id)))
}

const POPULATE_PANDIT_NAME = {
  path: 'panditId',
  select: 'userId',
  populate: { path: 'userId', select: 'name' },
} as const

export async function getCustomerDashboardStats(): Promise<CustomerStatsDTO | { error: true }> {
  try {
    const customerId = await getCustomerId()
    const now = new Date()

    const [total, upcoming, completed, completedIds, reviewedSet] = await Promise.all([
      Booking.countDocuments({ customerId }),
      Booking.countDocuments({ customerId, status: 'confirmed', scheduledAt: { $gte: now } }),
      Booking.countDocuments({ customerId, status: 'completed' }),
      Booking.distinct('_id', { customerId, status: 'completed' }),
      getReviewedBookingIds(customerId),
    ])

    const pendingReviews = completedIds.filter((id) => !reviewedSet.has(String(id))).length
    return { total, upcoming, completed, pendingReviews }
  } catch {
    return { error: true }
  }
}

export async function getUpcomingBookings(limit = 3): Promise<CustomerBookingDTO[]> {
  try {
    const customerId = await getCustomerId()
    const bookings = await Booking.find({
      customerId,
      status: 'confirmed',
      scheduledAt: { $gte: new Date() },
    })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .select('panditId poojaId scheduledAt status')
      .populate(POPULATE_PANDIT_NAME)
      .populate('poojaId', 'name price')
      .lean()

    return bookings.map((b) => toCustomerBooking(b, new Set()))
  } catch {
    return []
  }
}

export async function getPendingReviews(limit = 5): Promise<CustomerBookingDTO[]> {
  try {
    const customerId = await getCustomerId()
    const [completed, reviewedSet] = await Promise.all([
      Booking.find({ customerId, status: 'completed' })
        .sort({ updatedAt: -1 })
        .select('panditId poojaId scheduledAt status')
        .populate(POPULATE_PANDIT_NAME)
        .populate('poojaId', 'name price')
        .lean(),
      getReviewedBookingIds(customerId),
    ])

    return completed
      .filter((b) => !reviewedSet.has(String(b._id)))
      .slice(0, limit)
      .map((b) => toCustomerBooking(b, reviewedSet))
  } catch {
    return []
  }
}

export async function getCustomerBookings(
  status?: string,
  page = 1,
  limit = 10
): Promise<{ bookings: CustomerBookingDTO[]; total: number; pages: number }> {
  try {
    const customerId = await getCustomerId()
    const filter: Record<string, unknown> = { customerId }

    if (status === 'confirmed') {
      filter.status = 'confirmed'
      filter.scheduledAt = { $gte: new Date() }
    } else if (status === 'completed') {
      filter.status = 'completed'
    } else if (status === 'cancelled') {
      filter.status = { $in: ['cancelled', 'declined', 'expired'] }
    }

    const safePage = Math.max(1, page || 1)
    const [total, bookings, reviewedSet] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .sort({ scheduledAt: -1 })
        .skip((safePage - 1) * limit)
        .limit(limit)
        .select('panditId poojaId scheduledAt status')
        .populate(POPULATE_PANDIT_NAME)
        .populate('poojaId', 'name price')
        .lean(),
      getReviewedBookingIds(customerId),
    ])

    return {
      bookings: bookings.map((b) => toCustomerBooking(b, reviewedSet)),
      total,
      pages: Math.ceil(total / limit),
    }
  } catch {
    return { bookings: [], total: 0, pages: 0 }
  }
}

export async function getCustomerBookingDetail(bookingId: string): Promise<CustomerBookingDetailDTO | null> {
  try {
    const customerId = await getCustomerId()
    if (!mongoose.isValidObjectId(bookingId)) return null

    const booking = await Booking.findOne({ _id: bookingId, customerId })
      .select('panditId poojaId scheduledAt address status cancellation respondedAt createdAt updatedAt')
      .populate({
        path: 'panditId',
        select: 'sampraday experienceYears userId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('poojaId', 'name price')
      .lean()
    if (!booking) return null

    const hasReview = Boolean(await Review.exists({ bookingId: booking._id }))
    const pandit = booking.panditId as unknown as PopPanditWithUser
    const pooja = booking.poojaId as unknown as PopPooja

    return {
      _id: String(booking._id),
      panditId: String(pandit?._id ?? ''),
      panditName: pandit?.userId?.name ?? 'Pandit Ji',
      sampraday: pandit?.sampraday ?? '',
      experienceYears: pandit?.experienceYears ?? 0,
      poojaName: pooja?.name ?? '',
      price: pooja?.price ?? 0,
      scheduledAt: booking.scheduledAt.toISOString(),
      address: booking.address,
      status: booking.status,
      hasReview,
      cancellation: booking.cancellation
        ? {
            byRole: String(booking.cancellation.by) === customerId ? 'you' : 'pandit',
            reason: booking.cancellation.reason,
            at: booking.cancellation.at.toISOString(),
          }
        : null,
      timestamps: {
        requested: booking.createdAt.toISOString(),
        responded: booking.respondedAt?.toISOString() ?? null,
        completed: booking.status === 'completed' ? booking.updatedAt.toISOString() : null,
      },
    }
  } catch {
    return null
  }
}

export async function getBookingForReview(bookingId: string): Promise<BookingForReviewDTO | null> {
  try {
    const customerId = await getCustomerId()
    if (!mongoose.isValidObjectId(bookingId)) return null

    const booking = await Booking.findOne({ _id: bookingId, customerId })
      .select('panditId poojaId scheduledAt status updatedAt')
      .populate(POPULATE_PANDIT_NAME)
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return null

    // 30-day review window from completion (updatedAt proxy).
    const daysSince = (Date.now() - booking.updatedAt.getTime()) / 86_400_000
    if (booking.status === 'completed' && daysSince > 30) return null

    const hasReview = Boolean(await Review.exists({ bookingId: booking._id }))
    const pandit = booking.panditId as unknown as PopPanditWithUser
    const pooja = booking.poojaId as unknown as PopPooja

    return {
      _id: String(booking._id),
      panditName: pandit?.userId?.name ?? 'Pandit Ji',
      poojaName: pooja?.name ?? '',
      scheduledAt: booking.scheduledAt.toISOString(),
      status: booking.status,
      hasReview,
    }
  } catch {
    return null
  }
}

export async function getSuggestedPandits(limit = 3): Promise<SuggestedPanditDTO[]> {
  try {
    await getCustomerId()
    const pandits = await Pandit.find({ verificationStatus: 'verified' })
      .sort({ ratingWeighted: -1, completedBookings: -1 })
      .limit(limit)
      .select('userId ratingAvg ratingCount verificationStatus specialization languages')
      .populate<{ userId: { name?: string } }>('userId', 'name')
      .lean()

    return pandits.map((p) => ({
      _id: String(p._id),
      name: p.userId?.name ?? 'Pandit Ji',
      ratingAvg: p.ratingAvg ?? 0,
      ratingCount: p.ratingCount ?? 0,
      verificationStatus: p.verificationStatus,
      specialization: p.specialization ?? [],
      languages: p.languages ?? [],
    }))
  } catch {
    return []
  }
}

export interface SearchParamsInput {
  q?: string
  area?: string
  lang?: string
  minRating?: string
  maxPrice?: string
}

// Authenticated wrapper around the shared search (lib/db/search.ts). The public
// /search page calls the lib function directly — same query, no auth.
export async function searchPandits(params: SearchParamsInput): Promise<PanditSearchResultDTO[]> {
  try {
    await getCustomerId()
    return await searchVerifiedPanditsCached(params)
  } catch {
    return []
  }
}

export async function getCustomerReviews(limit = 20): Promise<CustomerReviewDTO[]> {
  try {
    const customerId = await getCustomerId()
    const reviews = await Review.find({ customerId, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'panditId bookingId overall ritualKnowledge punctuality behaviour communication comment createdAt panditReply'
      )
      .populate(POPULATE_PANDIT_NAME)
      .populate({
        path: 'bookingId',
        select: 'poojaId scheduledAt',
        populate: { path: 'poojaId', select: 'name' },
      })
      .lean()

    return reviews.map((r) => {
      const pandit = r.panditId as unknown as PopPanditWithUser
      const booking = r.bookingId as unknown as {
        _id?: unknown
        scheduledAt?: Date
        poojaId?: { name?: string }
      } | null
      return {
        _id: String(r._id),
        bookingId: String(booking?._id ?? ''),
        panditName: pandit?.userId?.name ?? 'Pandit Ji',
        poojaName: booking?.poojaId?.name ?? '',
        overall: r.overall,
        ritualKnowledge: r.ritualKnowledge,
        punctuality: r.punctuality,
        behaviour: r.behaviour,
        communication: r.communication,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        scheduledAt: booking?.scheduledAt?.toISOString() ?? '',
        panditReply: r.panditReply?.text ? { text: r.panditReply.text, at: r.panditReply.at.toISOString() } : null,
      }
    })
  } catch {
    return []
  }
}

export async function getCustomerSettings(): Promise<CustomerSettingsDTO | null> {
  try {
    const customerId = await getCustomerId()
    const user = await User.findById(customerId)
      .select('name email phone preferredLanguage passwordHash address status createdAt')
      .lean()
    if (!user) return null
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      hasPassword: Boolean(user.passwordHash),
      address: {
        line1: user.address?.line1 ?? '',
        city: user.address?.city ?? '',
        state: user.address?.state ?? '',
        pincode: user.address?.pincode ?? '',
      },
      memberSince: user.createdAt.toISOString(),
      status: user.status,
    }
  } catch {
    return null
  }
}

const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  preferredLanguage: z.enum(['hi', 'gu', 'en']),
})

export async function updateCustomerProfile(data: unknown): Promise<SettingsResult> {
  try {
    const customerId = await getCustomerId()
    const parsed = ProfileSchema.safeParse(data)
    if (!parsed.success) return { error: { code: 'invalid_input' } }
    await User.updateOne({ _id: customerId }, { $set: parsed.data })
    return { success: true }
  } catch (e) {
    console.error('[customer] updateCustomerProfile failed', e)
    return { error: { code: 'server' } }
  }
}

// Laxer than the onboarding CustomerAddressSchema: in Settings every field may
// be left empty (e.g. clearing the saved address), but a non-empty pincode must
// still be a valid 6-digit code.
const SettingsAddressSchema = z.object({
  line1: z.string().trim().max(200),
  city: z.string().trim().max(60),
  state: z.string().trim().max(60),
  pincode: z.string().trim().regex(/^(\d{6})?$/),
})

export async function updateCustomerAddress(data: unknown): Promise<SettingsResult> {
  try {
    const customerId = await getCustomerId()
    const parsed = SettingsAddressSchema.safeParse(data)
    if (!parsed.success) return { error: { code: 'invalid_input' } }
    await User.updateOne({ _id: customerId }, { $set: { address: parsed.data } })
    return { success: true }
  } catch (e) {
    console.error('[customer] updateCustomerAddress failed', e)
    return { error: { code: 'server' } }
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<SettingsResult> {
  try {
    const customerId = await getCustomerId()
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 100) {
      return { error: { code: 'invalid_input' } }
    }
    const user = await User.findById(customerId).select('passwordHash')
    if (!user?.passwordHash) return { error: { code: 'no_password' } }

    const valid = await bcrypt.compare(currentPassword ?? '', user.passwordHash)
    if (!valid) return { error: { code: 'wrong_password' } }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
    return { success: true }
  } catch (e) {
    console.error('[customer] changePassword failed', e)
    return { error: { code: 'server' } }
  }
}
