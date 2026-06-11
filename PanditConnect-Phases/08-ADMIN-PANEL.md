# Phase 8 — Admin Panel
> Claude Code Prompt · Requires Phase 1–7 complete

---

## PROMPT START

Build the complete Admin Panel. Routes under `app/(admin)/`. Admin role is enforced server-side on every route and action. Admin accounts are provisioned directly in the DB (no self-registration).

---

### Layout (`app/(admin)/layout.tsx`)

```tsx
// Wider sidebar: 260px
// Admin-specific nav items:
//   Overview
//   Verification Queue (badge: pending count)
//   Review Moderation (badge: pending count)
//   User Management
//   Analytics
//   Settings
// Top bar: "Admin Panel" label + current admin name
// All pages server-rendered by default
```

---

### Route: `/admin` (Overview Dashboard)

```tsx
// Platform KPI cards:
//   Verified Pandits | Pending Verification | Total Customers
//   Total Bookings | Completed This Month | Reviews Pending Moderation

// Alert strip: any pandit pending > 48h (SLA breach)

// Quick links: Go to Verification Queue | Go to Moderation
```

**Server action:**
```typescript
export async function getAdminOverviewStats() {
  // role check: admin only
  const [
    verifiedPandits, pendingVerification, totalCustomers,
    totalBookings, completedThisMonth, pendingReviews, slaBreaches
  ] = await Promise.all([
    Pandit.countDocuments({ verificationStatus: 'verified' }),
    Pandit.countDocuments({ verificationStatus: 'pending' }),
    User.countDocuments({ role: 'customer', status: { $ne: 'deleted' } }),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'completed', updatedAt: { $gte: startOfMonth } }),
    Review.countDocuments({ status: 'pending' }),
    Pandit.countDocuments({
      verificationStatus: 'pending',
      updatedAt: { $lt: new Date(Date.now() - 48 * 3600000) }
    }),
  ])
  return { verifiedPandits, pendingVerification, totalCustomers, totalBookings, completedThisMonth, pendingReviews, slaBreaches }
}
```

---

### Route: `/admin/verification` (Pandit Verification Queue)

```tsx
// Table with columns:
//   Photo | Name | Sampraday | Experience | Languages | Submitted | Days Waiting | Actions

// Filter: All Pending | Recently Rejected | Verified

// Row expand: shows all submitted profile data including:
//   - Full contact details (for admin only, not shown to anyone else)
//   - Aadhaar last 4 (display: "Aadhaar: ****XXXX")
//   - Uploaded document (link to Cloudinary — admin only)
//   - All service listings with prices
//   - Materials per service

// Actions:
//   [Approve] — green button, immediate, sends email
//   [Reject] — opens modal with required reason textarea (min 10 chars)
//   [View Full Profile] — opens side panel

// Pagination: 20 per page
// Sort: Oldest first (by default — FIFO queue)
```

**Verification API** (`app/api/admin/verify/route.ts`) — already built in Phase 2. Extend to log actions:
```typescript
// Add to verification handler:
// Log to adminAuditLog collection: { adminId, action, targetId, targetType, reason, at }
// This gives full audit trail for compliance
```

---

### Route: `/admin/moderation` (Review Moderation)

```tsx
// Tabs: Pending Reviews | Flagged Reviews | Moderated

// Table: Reviewer | Pandit | Pooja | Rating | Comment | Flags | Submitted | Actions

// Actions:
//   [Publish] — auto if accidentally held
//   [Hide] — hidden from public, pandit can see
//   [Remove] — permanent removal, requires note
//   [View Booking] — link to booking detail

// Bulk select + bulk action (Publish all / Remove all selected)
```

---

### Route: `/admin/users` (User Management)

```tsx
// Two sub-tabs: Customers | Pandits

// Customer table: Name | Email | Phone | Status | Bookings | Joined | Actions
// Pandit table: Name | Status | Verified | Rating | Completed | Joined | Actions

// Per-user actions:
//   View full profile
//   Suspend account (with reason)
//   Restore account
//   Delete account (soft delete — anonymise reviews)

// Search: by name, email, or phone (partial match, min 3 chars)
```

**User Management Actions** (`actions/admin.ts`):
```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { Review } from '@/lib/db/models/Review'

function requireAdmin() {
  // Must be called at top of every admin action
  // throws if not admin
}

export async function suspendUser(userId: string, reason: string) {
  await requireAdmin()
  if (!reason?.trim()) return { error: 'Suspension reason required' }
  await connectDB()
  await User.updateOne({ _id: userId }, { status: 'suspended', suspensionReason: reason })
  return { success: true }
}

export async function restoreUser(userId: string) {
  await requireAdmin()
  await connectDB()
  await User.updateOne({ _id: userId, status: 'suspended' }, { status: 'active', $unset: { suspensionReason: 1 } })
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  await connectDB()
  // Soft delete user
  await User.updateOne({ _id: userId }, { status: 'deleted', deletedAt: new Date(), name: 'Deleted User', email: `deleted_${userId}@removed.com`, phone: `+00000000000` })
  // Anonymise pandit profile
  await Pandit.updateOne({ userId }, { deletedAt: new Date() })
  // Anonymise reviews (preserve rating integrity)
  await Review.updateMany({ customerId: userId }, { $set: { anonymised: true } })
  return { success: true }
}

export async function searchUsers(query: string, role?: 'customer' | 'pandit') {
  await requireAdmin()
  if (query.length < 3) return { error: 'Query too short' }
  await connectDB()
  
  const filter: Record<string, unknown> = {
    status: { $ne: 'deleted' },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  }
  if (role) filter.role = role
  
  const users = await User.find(filter).select('-passwordHash -otpHash').limit(50).lean()
  return { users }
}
```

---

### Route: `/admin/analytics` (Platform Analytics)

```tsx
// NOTE: MVP analytics only — no external analytics service needed.
// All computed from MongoDB aggregations.

// Charts (use recharts):
//   1. Bookings by status (pie/donut): requested/confirmed/completed/cancelled/expired
//   2. Bookings per month (line chart): last 6 months
//   3. Review submissions per month: last 6 months
//   4. Top 10 pandits by completed bookings (bar chart)
//   5. Top poojas by booking count (horizontal bar)

// KPI table:
//   Search success rate (searches returning ≥3 results) — approximate from logs
//   Booking conversion rate (bookings / estimated searches)
//   Pandit response rate (average across all pandits)
//   Review coverage (reviews / completed bookings)
//   Repeat booking rate (customers with ≥2 bookings)
```

**Analytics Server Action:**
```typescript
export async function getPlatformAnalytics() {
  await requireAdmin()
  await connectDB()
  
  const [
    bookingsByStatus,
    bookingsPerMonth,
    topPandits,
    topPoojas,
    repeatCustomers,
    reviewCoverage,
  ] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Pandit.find({ verificationStatus: 'verified' }).sort({ completedBookings: -1 }).limit(10)
      .populate('userId', 'name').lean(),
    Booking.aggregate([
      { $group: { _id: '$poojaId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: 'poojas', localField: '_id', foreignField: '_id', as: 'pooja' } },
    ]),
    User.aggregate([
      { $match: { role: 'customer' } },
      { $lookup: { from: 'bookings', localField: '_id', foreignField: 'customerId', as: 'bookings' } },
      { $project: { hasRepeat: { $gt: [{ $size: '$bookings' }, 1] } } },
      { $group: { _id: null, total: { $sum: 1 }, repeat: { $sum: { $cond: '$hasRepeat', 1, 0 } } } },
    ]),
    (async () => {
      const completed = await Booking.countDocuments({ status: 'completed' })
      const reviewed = await Review.countDocuments({})
      return completed > 0 ? reviewed / completed : 0
    })(),
  ])
  
  return { bookingsByStatus, bookingsPerMonth, topPandits, topPoojas, repeatCustomers: repeatCustomers[0], reviewCoverage }
}
```

---

### Audit Log Model

Add to `lib/db/models/AuditLog.ts`:
```typescript
// Fields: adminId, action, targetId, targetType, before, after, reason, ip, at
// No update, no delete — append-only
// Indexes: adminId, targetId, at
```

---

### Phase 8 Acceptance Criteria

- [ ] All admin routes return 403 for non-admin users (tested with customer + pandit sessions)
- [ ] Rejection requires a reason — UI blocks submission without it
- [ ] User suspension stores reason; suspended users get `status: 'suspended'` and cannot authenticate
- [ ] Deleted user: name anonymized, email scrambled, reviews show "Verified Customer"
- [ ] Bulk moderation (select all + publish) works correctly
- [ ] Analytics charts render without errors when data is sparse (0 bookings/reviews)
- [ ] Verification queue sorted oldest-first (FIFO)
- [ ] SLA breach alert shows correctly when pandit pending > 48h
- [ ] Every verification approve/reject writes to AuditLog
- [ ] Admin can search users by partial email — cannot enumerate via timing attack (same response time for found/not found)
