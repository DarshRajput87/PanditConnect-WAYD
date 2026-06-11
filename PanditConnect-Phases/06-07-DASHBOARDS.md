# Phase 6 — Customer Dashboard
> Claude Code Prompt · Requires Phase 1–5 complete

---

## PROMPT START (Phase 6)

Build the complete Customer Dashboard. All routes under `app/(customer)/dashboard/`.

### Layout (`app/(customer)/dashboard/layout.tsx`)

```tsx
// Sidebar (desktop, 240px) | Main content area
// Mobile: bottom tab bar (4 tabs)
// Sidebar items:
//   Dashboard (home icon)
//   My Bookings (calendar icon)
//   Saved Pandits (heart icon) — Phase 2, stub only
//   Account Settings (settings icon)
// Active item: orange-500 text + left border, bg-orange-50
// User name + avatar at top of sidebar
```

---

### Route: `/dashboard/customer` (Overview)

```tsx
// Server component
// Widgets row:
//   Total Bookings (count all statuses except deleted)
//   Upcoming (count confirmed, scheduled in future)
//   Completed (count completed)
//   Pending Reviews (count completed bookings without a review)

// Recent bookings: last 5, BookingCard component
// Quick action: "Book a Pooja" → /search (orange CTA button)
```

---

### Route: `/dashboard/customer/bookings` (All Bookings)

```tsx
// Tab filter: All | Upcoming | Completed | Cancelled
// Each tab fetches filtered bookings from server action
// Sorted: upcoming by scheduledAt asc, others by updatedAt desc
// BookingCard for each
// Pagination: 10 per page
// Empty state per tab: contextual message + "Book a Pooja" link

// BookingCard actions by status:
//   requested: [Cancel]
//   confirmed: [Cancel] [View Details]
//   completed + no review: [Write Review] (orange)
//   completed + reviewed: [View Review]
//   expired: [Rebook → /search]
//   cancelled/declined: [Rebook]
```

---

### Route: `/dashboard/customer/bookings/[id]` (Booking Detail)

```tsx
// Header: Status badge + booking ref number
// Info card: Pandit (photo, name, verified badge) | Pooja | Date & Time | Address | Price
// Timeline: requested → confirmed/declined/expired → completed
//   Each step: icon + label + timestamp
// Actions section (based on status — as above)
// Cancellation info (if cancelled): who, when, reason
```

---

### Route: `/dashboard/customer/settings` (Account)

```tsx
// Two sections:
// 1. Profile: name, phone (readonly), email (readonly), preferred language (editable)
// 2. Security: Change password form (current + new + confirm)
// Save button per section
// Success/error toast feedback
```

---

### Customer Server Actions (`actions/customer.ts`)

```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
import { z } from 'zod'

export async function getCustomerBookings(status?: string, page = 1, limit = 10) {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { error: 'Unauthorized' }
  await connectDB()

  const filter: Record<string, unknown> = { customerId: session.user.id }
  if (status === 'upcoming') filter.status = 'confirmed'
  else if (status === 'completed') filter.status = 'completed'
  else if (status === 'cancelled') filter.status = { $in: ['cancelled','declined','expired'] }

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .sort(status === 'upcoming' ? { scheduledAt: 1 } : { updatedAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate('panditId', 'profilePhoto ratingAvg verificationStatus')
      .populate('poojaId', 'name price')
      .populate({ path: 'panditId', populate: { path: 'userId', select: 'name' } })
      .lean(),
  ])
  return { bookings, total, page, pages: Math.ceil(total / limit) }
}

export async function getCustomerDashboardStats() {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { error: 'Unauthorized' }
  await connectDB()

  const [total, upcoming, completed] = await Promise.all([
    Booking.countDocuments({ customerId: session.user.id }),
    Booking.countDocuments({ customerId: session.user.id, status: 'confirmed', scheduledAt: { $gte: new Date() } }),
    Booking.countDocuments({ customerId: session.user.id, status: 'completed' }),
  ])

  // Pending reviews: completed bookings without a review
  const completedIds = await Booking.distinct('_id', { customerId: session.user.id, status: 'completed' })
  const reviewedIds = await Review.distinct('bookingId', { customerId: session.user.id })
  const pendingReviews = completedIds.length - reviewedIds.filter(id =>
    completedIds.some(bid => bid.toString() === id.toString())
  ).length

  return { total, upcoming, completed, pendingReviews }
}

export async function updateCustomerProfile(data: { name?: string; preferredLanguage?: string }) {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { error: 'Unauthorized' }
  
  const schema = z.object({
    name: z.string().min(2).max(60).optional(),
    preferredLanguage: z.enum(['hi','gu','en']).optional(),
  })
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  await User.updateOne({ _id: session.user.id }, { $set: parsed.data })
  return { success: true }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }
  
  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
  
  await connectDB()
  const bcrypt = await import('bcryptjs')
  const user = await User.findById(session.user.id)
  if (!user || !user.passwordHash) return { error: 'Cannot update password' }
  
  const valid = await bcrypt.default.compare(currentPassword, user.passwordHash)
  if (!valid) return { error: 'Current password is incorrect' }
  
  const newHash = await bcrypt.default.hash(newPassword, 12)
  await User.updateOne({ _id: session.user.id }, { passwordHash: newHash })
  return { success: true }
}
```

---

### Phase 6 Acceptance Criteria

- [ ] Stat widgets show correct counts (no stale data)
- [ ] Tab filter "Upcoming" shows only confirmed, future-date bookings
- [ ] "Pending Reviews" count matches completed bookings without reviews
- [ ] "Write Review" only appears when booking is completed AND no review exists
- [ ] Cancel button not shown for completed/declined/expired bookings
- [ ] Settings: language change persists and updates UI locale
- [ ] Mobile bottom tab bar works at 375px
- [ ] No unauthorized access: customer cannot see other customer's bookings

---
---

# Phase 7 — Pandit Dashboard
> Claude Code Prompt · Requires Phase 1–6 complete

---

## PROMPT START (Phase 7)

Build the complete Pandit Dashboard. Routes under `app/(pandit)/dashboard/`.

### Layout (`app/(pandit)/dashboard/layout.tsx`)

```tsx
// Same sidebar pattern as customer dashboard
// Sidebar items:
//   Overview (home)
//   Inquiries (inbox — with badge for new)
//   Revenue (bar chart icon)
//   My Services (list icon)
//   Reviews (star icon)
//   My Profile (user icon)
//   Settings (gear icon)
// Verification status banner if not verified: "Profile under review" (yellow banner)
```

---

### Route: `/dashboard/pandit` (Overview)

```tsx
// Stats row:
//   Total Completed    | This Month Completed
//   Pending Requests   | Avg Rating (raw)
// Chart: Bookings by month (last 6 months) — bar chart using recharts or pure CSS
// Recent inquiries: last 5 bookings in requested/confirmed state
```

---

### Route: `/dashboard/pandit/inquiries` (Bookings Inbox)

```tsx
// Tabs: New Requests | Confirmed | Completed | All
// New Requests: status=requested, sorted by createdAt desc, expiresAt countdown timer
// Each card shows: Customer name, Pooja, Date, Address (city), Price
// Actions:
//   requested: [Accept] (green) [Decline] (outline red)
//   confirmed: [Mark Complete] [Cancel with Reason]
// Accept/Decline: inline confirmation, no full page reload
// Countdown timer for expiry (client-side, refresh from expiresAt)
```

**ExpiryCountdown.tsx** (client component):
```tsx
// Props: expiresAt: Date
// Shows: "Expires in 1h 23m" → counts down every second
// Turns red when < 30 minutes
// Shows "Expired" if past
```

---

### Route: `/dashboard/pandit/revenue` (Earnings)

```tsx
// Important: MVP has no payments. Show "potential earnings" based on confirmed/completed bookings.
// Banner: "Earnings shown are indicative. Payment processing coming soon."

// Stats:
//   Total Potential Earnings (sum of completed booking prices)
//   This Month
//   Avg Booking Value

// Table: Booking | Customer | Pooja | Date | Amount | Status
// Only Completed bookings shown in earnings (cancelled/refunded excluded)
// Export CSV button (client-side, generate from data)
```

---

### Route: `/dashboard/pandit/services` (Pooja Management)

```tsx
// List of all poojas with toggle (active/inactive)
// Each row: Pooja name | Price | Duration | Materials count | Active toggle | Edit | Delete
// "Add New Service" button → inline form or modal
// Delete: blocked if active bookings exist → show "Cannot delete, has active bookings. Unlist instead."
// Materials: expand row to show materials list (inline edit)
```

**Pandit Service Actions** (`actions/pandit-services.ts`):
```typescript
'use server'
export async function togglePoojaActive(poojaId: string, active: boolean) { /* ... */ }
export async function updatePooja(poojaId: string, data: Partial<IPooja>) { /* ... */ }
export async function deletePooja(poojaId: string) {
  // Block if confirmed bookings exist
  const activeBookings = await Booking.countDocuments({ poojaId, status: { $in: ['requested','confirmed'] } })
  if (activeBookings > 0) return { error: 'Cannot delete a service with active bookings. Unlist it instead.' }
  // Soft delete (mark inactive) rather than hard delete
  await Pooja.updateOne({ _id: poojaId }, { active: false })
  return { success: true }
}
```

---

### Route: `/dashboard/pandit/reviews` (Review Management)

```tsx
// Stats: Avg Rating | Total Reviews | By dimension averages
// Review list: all published reviews for this pandit
// Each: customer name, pooja, date, overall stars + dimensions, comment
// Reply button if no reply yet → inline textarea + submit
// Flag button → sends flag for admin
// "Reply" form: appears below the review inline (not modal)
```

---

### Route: `/dashboard/pandit/profile` (Edit Public Profile)

```tsx
// Live preview toggle: show how profile looks to customers
// Editable fields: bio (textarea), photo (upload), languages (checkboxes)
// Service areas: tag input (pincodes/cities)
// Sampraday, specialization (from catalogue multi-select)
// Save button: calls savePanditDraft()
// Verification status display (cannot change here — admin only)
```

---

### Route: `/dashboard/pandit/settings`

```tsx
// Language preference
// Notification preferences (email on/off for booking requests, reminders)
// Change password
// Account section: "Need help? Contact support"
```

---

### Pandit Dashboard Server Actions (`actions/pandit-dashboard.ts`)

```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Review } from '@/lib/db/models/Review'

export async function getPanditOverviewStats() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  
  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id }).lean()
  if (!pandit) return { error: 'Pandit not found' }
  
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  
  const [pendingCount, thisMonthCompleted, reviewData] = await Promise.all([
    Booking.countDocuments({ panditId: pandit._id, status: 'requested', expiresAt: { $gt: new Date() } }),
    Booking.countDocuments({ panditId: pandit._id, status: 'completed', updatedAt: { $gte: thisMonth } }),
    Review.aggregate([
      { $match: { panditId: pandit._id, status: 'published' } },
      { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } }
    ]),
  ])
  
  return {
    totalCompleted: pandit.completedBookings,
    thisMonthCompleted,
    pendingRequests: pendingCount,
    avgRating: reviewData[0]?.avg || 0,
    ratingCount: reviewData[0]?.count || 0,
    verificationStatus: pandit.verificationStatus,
  }
}

export async function getPanditMonthlyBookings() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit) return { error: 'Not found' }
  
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const data = await Booking.aggregate([
    { $match: { panditId: pandit._id, status: 'completed', updatedAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])
  return data
}
```

---

### Phase 7 Acceptance Criteria

- [ ] Verification banner shown if pandit not verified
- [ ] "New Requests" tab shows only requested + not expired bookings
- [ ] Expiry countdown turns red when < 30 minutes
- [ ] Accept/Decline updates status and removes card from "New Requests"
- [ ] Revenue table excludes cancelled bookings
- [ ] Deleting service with active bookings blocked with clear message
- [ ] Pandit can only see own bookings, reviews, and revenue
- [ ] "Today" boundary computed in pandit's local timezone
- [ ] Reply form hides after successful submission; "replied" indicator shows
- [ ] Profile edits save and reflect on public profile after save
