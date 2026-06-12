'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
import mongoose from 'mongoose'
import { z } from 'zod'

type ReviewErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'already_replied'
  | 'already_reviewed'
  | 'invalid_state'
  | 'window_closed'
  | 'invalid_input'
  | 'server'
export type ReplyResult = { error: { code: ReviewErrorCode } } | { success: true }

const ReplySchema = z.string().trim().min(5).max(500)

const RatingSchema = z.number().int().min(1).max(5)
const CreateReviewSchema = z.object({
  overall: RatingSchema,
  ritualKnowledge: RatingSchema.optional(),
  punctuality: RatingSchema.optional(),
  behaviour: RatingSchema.optional(),
  communication: RatingSchema.optional(),
  comment: z.string().trim().max(1000).optional(),
})

const REVIEW_WINDOW_DAYS = 30

// Recompute the pandit's published-review aggregates. ratingWeighted applies
// Bayesian-style shrinkage so a single 5★ review doesn't outrank a 4.8★/50.
async function refreshPanditRating(panditId: mongoose.Types.ObjectId) {
  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { panditId, status: 'published' } },
    { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } },
  ])
  const avg = agg[0]?.avg ?? 0
  const count = agg[0]?.count ?? 0
  const weighted = avg * (count / (count + 5))
  await Pandit.updateOne(
    { _id: panditId },
    { $set: { ratingAvg: avg, ratingCount: count, ratingWeighted: weighted } }
  )
}

export async function createReview(bookingId: string, input: unknown): Promise<ReplyResult> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'customer') return { error: { code: 'unauthorized' } }

    const parsed = CreateReviewSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    await connectDB()
    if (!mongoose.isValidObjectId(bookingId)) return { error: { code: 'not_found' } }

    const booking = await Booking.findOne({ _id: bookingId, customerId: session.user.id })
    if (!booking) return { error: { code: 'not_found' } }
    if (booking.status !== 'completed') return { error: { code: 'invalid_state' } }

    // updatedAt is the completion timestamp proxy (status flipped to completed then).
    const daysSince = (Date.now() - booking.updatedAt.getTime()) / 86_400_000
    if (daysSince > REVIEW_WINDOW_DAYS) return { error: { code: 'window_closed' } }

    const existing = await Review.exists({ bookingId: booking._id })
    if (existing) return { error: { code: 'already_reviewed' } }

    // Published immediately — admin moderation (hide/remove) comes in a later phase.
    await Review.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      panditId: booking.panditId,
      ...parsed.data,
      comment: parsed.data.comment || undefined,
      status: 'published',
    })
    await refreshPanditRating(booking.panditId)
    return { success: true }
  } catch (e) {
    console.error('[review] createReview failed', e)
    return { error: { code: 'server' } }
  }
}

export async function addPanditReply(reviewId: string, text: string): Promise<ReplyResult> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'pandit') return { error: { code: 'unauthorized' } }

    const parsed = ReplySchema.safeParse(text)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    await connectDB()
    const pandit = await Pandit.findOne({ userId: session.user.id }).select('_id').lean()
    if (!pandit) return { error: { code: 'unauthorized' } }

    const review = await Review.findOne({ _id: reviewId, panditId: pandit._id, status: 'published' })
    if (!review) return { error: { code: 'not_found' } }
    if (review.panditReply?.text) return { error: { code: 'already_replied' } }

    review.panditReply = { text: parsed.data, at: new Date() }
    await review.save()
    return { success: true }
  } catch (e) {
    console.error('[review] addPanditReply failed', e)
    return { error: { code: 'server' } }
  }
}
