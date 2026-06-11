# Phase 5 — Review & Trust System
> Claude Code Prompt · Requires Phase 1–4 complete

---

## PROMPT START

Build Phase 5: the complete multi-dimensional review system with Bayesian rating aggregation, anti-fraud controls, and moderation pipeline. The review system is the trust engine of PanditConnect.

---

### Task 1: Review Server Action (`actions/review.ts`)

```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Review } from '@/lib/db/models/Review'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
import { recomputePanditRating } from '@/lib/ranking/engine'
import { z } from 'zod'

const EDIT_WINDOW_DAYS = 7
const REVIEW_WINDOW_DAYS = 30
const MAX_REVIEWS_PER_DAY = 3  // anti-bombing

const CreateReviewSchema = z.object({
  bookingId: z.string().length(24),
  overall: z.number().int().min(1).max(5),
  ritualKnowledge: z.number().int().min(1).max(5).optional(),
  punctuality: z.number().int().min(1).max(5).optional(),
  behaviour: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional().transform(s => s?.trim()),
})

export async function createReview(data: unknown) {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { error: 'Unauthorized' }

  const parsed = CreateReviewSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  const { bookingId, overall, ritualKnowledge, punctuality, behaviour, communication, comment } = parsed.data

  // Verify booking exists, is completed, and belongs to this customer
  const booking = await Booking.findById(bookingId)
  if (!booking) return { error: 'Booking not found' }
  if (booking.customerId.toString() !== session.user.id) return { error: 'This is not your booking' }
  if (booking.status !== 'completed') return { error: 'Reviews can only be submitted for completed bookings' }

  // Review window: max 30 days after completion
  const daysSinceCompletion = (Date.now() - new Date(booking.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCompletion > REVIEW_WINDOW_DAYS) {
    return { error: 'The review window for this booking has closed (30 days after completion)' }
  }

  // Anti-self-review: ensure customer != pandit
  const pandit = await Pandit.findById(booking.panditId)
  if (pandit && pandit.userId.toString() === session.user.id) {
    return { error: 'You cannot review your own service' }
  }

  // Rate limiting: max reviews per day
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const reviewsToday = await Review.countDocuments({
    customerId: session.user.id,
    createdAt: { $gte: today },
  })
  if (reviewsToday >= MAX_REVIEWS_PER_DAY) {
    return { error: 'Daily review limit reached. Try again tomorrow.' }
  }

  // Sanitize comment
  const sanitized = comment ? sanitizeText(comment) : undefined

  // Upsert: one review per booking (edit if exists within window)
  const existing = await Review.findOne({ bookingId })
  if (existing) {
    const editDeadline = new Date(existing.createdAt.getTime() + EDIT_WINDOW_DAYS * 86400000)
    if (new Date() > editDeadline) return { error: 'The edit window for this review has closed (7 days)' }

    await Review.updateOne({ _id: existing._id }, {
      overall, ritualKnowledge, punctuality, behaviour, communication,
      comment: sanitized,
      $push: { editHistory: { text: existing.comment || '', editedAt: new Date() } },
    })
    await recomputePanditRating(booking.panditId.toString())
    return { success: true, action: 'updated' }
  }

  const review = await Review.create({
    bookingId, customerId: session.user.id, panditId: booking.panditId,
    overall, ritualKnowledge, punctuality, behaviour, communication,
    comment: sanitized,
    status: 'pending',  // moderation check first
  })

  // Auto-publish if clean; else queue for admin
  const modResult = await moderateReviewText(sanitized || '')
  if (modResult.clean) {
    await Review.updateOne({ _id: review._id }, { status: 'published' })
    await recomputePanditRating(booking.panditId.toString())
  }
  // If flagged, stays 'pending' for admin review

  return { success: true, action: 'created', moderated: !modResult.clean }
}

export async function addPanditReply(reviewId: string, text: string) {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  if (!text?.trim() || text.length > 500) return { error: 'Reply must be 1–500 characters' }

  await connectDB()
  const review = await Review.findById(reviewId)
  if (!review) return { error: 'Review not found' }

  // Verify pandit owns this review
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit || review.panditId.toString() !== pandit._id.toString()) {
    return { error: 'Unauthorized' }
  }
  if (review.status !== 'published') return { error: 'Cannot reply to an unpublished review' }
  if (review.panditReply?.text) return { error: 'You have already replied to this review' }

  const sanitized = sanitizeText(text.trim())
  await Review.updateOne({ _id: reviewId }, { panditReply: { text: sanitized, at: new Date() } })
  return { success: true }
}

export async function flagReview(reviewId: string, reason: string) {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  if (!reason?.trim()) return { error: 'Flag reason required' }

  await connectDB()
  await Review.updateOne(
    { _id: reviewId, status: 'published' },
    { $addToSet: { flaggedBy: session.user.id }, status: 'pending' }
  )
  return { success: true }
}

// Admin actions
export async function moderateReview(reviewId: string, action: 'publish' | 'hide' | 'remove', note?: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Forbidden' }

  await connectDB()
  const review = await Review.findById(reviewId)
  if (!review) return { error: 'Not found' }

  const statusMap = { publish: 'published', hide: 'hidden', remove: 'removed' }
  await Review.updateOne({ _id: reviewId }, { status: statusMap[action] })

  await recomputePanditRating(review.panditId.toString())
  return { success: true }
}

// Basic text sanitization
function sanitizeText(text: string): string {
  const BLOCKED_PATTERNS = [
    /\b\d{10,12}\b/g,           // phone numbers
    /\b\d{12}\b/g,               // aadhaar
    /[\w.-]+@[\w.-]+\.\w+/g,    // emails
  ]
  let clean = text
  for (const p of BLOCKED_PATTERNS) clean = clean.replace(p, '[removed]')
  return clean.slice(0, 1000)
}

interface ModerationResult { clean: boolean; flags: string[] }

async function moderateReviewText(text: string): Promise<ModerationResult> {
  const flags: string[] = []
  const PROFANITY = ['spam', 'fake', 'scam']  // expand with real list
  const lower = text.toLowerCase()
  for (const word of PROFANITY) {
    if (lower.includes(word)) flags.push(`profanity:${word}`)
  }
  if (/\b\d{10}\b/.test(text)) flags.push('pii:phone')
  return { clean: flags.length === 0, flags }
}
```

---

### Task 2: Review Submission UI (`app/(customer)/dashboard/bookings/[id]/review/page.tsx`)

```tsx
// Guard: redirect if booking not found, not customer's, or status !== 'completed'
// Guard: redirect if review already submitted AND edit window closed
// Guard: redirect if > 30 days since completion

// Layout: clean card, max-w-lg centered
// Title: "How was your experience?"
// Subtitle: Pandit name, Pooja, Date

// 1. Overall Rating (required) — large 5-star selector
//    Stars: empty → filled orange on hover/click
//    Label changes: 1=Poor, 2=Fair, 3=Good, 4=Great, 5=Excellent

// 2. Dimension ratings (optional — shown as collapsible "Rate specific aspects")
//    Each: small label + 5 clickable stars
//    - Ritual Knowledge
//    - Punctuality  
//    - Behaviour
//    - Communication

// 3. Written comment (optional) — textarea, 1000 char limit with counter

// 4. Submit button (orange, disabled until overall is selected)
//    Loading state during submission
//    Success: toast + redirect to booking page
```

**StarPicker.tsx** (`components/shared/StarPicker.tsx`):
```tsx
interface Props { value: number; onChange: (v: number) => void; size?: 'sm' | 'lg' }
// Hover state: fill stars up to hovered index (orange-400)
// Selected state: fill stars up to value (orange-500)
// Empty: gray-200
// Use lucide Star icon, toggle fill via className
// Accessible: aria-label per star
```

---

### Task 3: Review Display Components

**ReviewList.tsx:**
```tsx
// Props: panditId, initialReviews, totalCount
// Client component with load-more (fetch next page on click)
// Sort control: Most Recent | Highest | Lowest
// Each review → ReviewCard
```

**ReviewCard.tsx:**
```tsx
// Layout:
// [Reviewer name (or "Verified Customer")] [Date]
// [Verified Booking badge — green chip]
// [Pooja name chip — gray]
// [Overall: ★★★★★ 5.0]
// [Dimension chips: Knowledge ★5 · Punctuality ★4 · ...]
// [Comment text — 3 lines clamped, "Show more" link]
// [Pandit reply — indented, left-border orange-300, "Reply by Pandit Ji"]
// [Flag link — small gray, opens modal with reason input]

// Empty state (no reviews):
// Icon + "New on PanditConnect — be the first to review after your pooja"
// Never show "0.0 ★" or "No reviews yet" without the positive framing
```

**RatingBreakdown.tsx:**
```tsx
// Props: { avg: number, count: number, distribution: Record<1|2|3|4|5, number> }
// Shows:
//   Large avg number (raw) — e.g., "4.7"
//   5-star to 1-star bar chart (distribution percentages)
//   Per-dimension averages (Knowledge, Punctuality, Behaviour, Comm)
//   Total review count
```

---

### Task 4: Admin Review Moderation Queue

**`app/(admin)/moderation/reviews/page.tsx`** — server component:
```typescript
// Fetch reviews with status: 'pending' (flagged or new)
// Table: Reviewer | Pandit | Pooja | Rating | Comment | Flags | Actions
// Actions: Publish | Hide | Remove (with reason modal)
// Bulk actions: select multiple → Publish All / Remove All
```

**API Route: `/api/admin/reviews/[id]`** (POST):
```typescript
// Body: { action: 'publish' | 'hide' | 'remove', note?: string }
// Auth: admin only
// After moderation: recomputePanditRating() to update rankings
// Log: every moderation action saved (who, when, action, note)
```

---

### Task 5: Bayesian Rating Recomputation

Triggered on every review create/edit/remove/moderate. Already defined in Phase 3 (`lib/ranking/engine.ts`). Add a safety-net reconciliation job:

**`app/api/cron/recompute-ratings/route.ts`:**
```typescript
// GET (cron, daily)
// For every pandit with recent review activity (last 24h)
// Call recomputePanditRating(panditId)
// Vercel cron: "0 2 * * *" (2am daily)
```

---

### Task 6: Acceptance Criteria

- [ ] Review CTA hidden for non-completed bookings at both UI and server level
- [ ] Non-customer of booking cannot submit review (server rejects with 403)
- [ ] Attempting second review on same booking within edit window → edits existing
- [ ] Attempting second review after 7-day edit window → error message
- [ ] Attempting review >30 days after completion → error message
- [ ] Self-review (pandit == customer) rejected server-side
- [ ] Daily rate limit (3 reviews/day) enforced
- [ ] Phone numbers and emails in comment text are stripped before saving
- [ ] Review with profanity stays `pending` for admin; clean review auto-publishes
- [ ] Pandit can reply only once; second attempt returns error
- [ ] Rating breakdown bars sum to 100% per dimension
- [ ] `ratingWeighted` on Pandit document updates after every review change
- [ ] New pandit (0 reviews) shows "New on PanditConnect" — never "0.0 ★"
- [ ] Admin moderation actions are logged with actor + timestamp
- [ ] Flag on published review moves it back to pending for admin review
