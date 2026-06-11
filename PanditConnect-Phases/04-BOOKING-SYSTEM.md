# Phase 4 — Booking System
> Claude Code Prompt · Requires Phase 1–3 complete

---

## PROMPT START

Build Phase 4: the complete booking system including the booking flow UI, state machine, conflict prevention, and expiry handling.

### Booking State Machine
```
Requested → Accepted/Confirmed → Completed → (Reviewed)
         → Declined (terminal)
         → Expired (terminal, no response within SLA)
         → Cancelled (terminal, either party)
```

**SLA:** Pandit must respond within `BOOKING_SLA_HOURS` (default 2h). Auto-expire via a cron-like API route.

---

### Task 1: Booking Server Action (`actions/booking.ts`)

```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { z } from 'zod'

const SLA_HOURS = parseInt(process.env.BOOKING_SLA_HOURS || '2')
const MAX_BOOKING_DAYS_AHEAD = 365
const MIN_LEAD_HOURS = 4

const CreateBookingSchema = z.object({
  panditId: z.string().length(24),
  poojaId: z.string().length(24),
  scheduledAt: z.coerce.date()
    .refine(d => d > new Date(Date.now() + MIN_LEAD_HOURS * 3600000), 'Must be at least 4 hours from now')
    .refine(d => d < new Date(Date.now() + MAX_BOOKING_DAYS_AHEAD * 86400000), 'Cannot book more than 1 year ahead'),
  address: z.object({
    line1: z.string().min(5).max(200),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  }),
  timezone: z.string().default('Asia/Kolkata'),
})

export async function createBooking(data: unknown) {
  const session = await auth()
  if (!session || session.user.role !== 'customer') return { error: 'Unauthorized' }

  const parsed = CreateBookingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  const { panditId, poojaId, scheduledAt, address, timezone } = parsed.data

  // Verify pandit is verified
  const pandit = await Pandit.findById(panditId)
  if (!pandit || pandit.verificationStatus !== 'verified') return { error: 'Pandit is not available' }

  // Verify pooja belongs to pandit
  const pooja = await Pooja.findOne({ _id: poojaId, panditId, active: true })
  if (!pooja) return { error: 'Service not found' }

  // ATOMIC conflict check: no confirmed booking at same slot (±1 hour)
  const slotStart = new Date(scheduledAt.getTime() - 60 * 60000)
  const slotEnd = new Date(scheduledAt.getTime() + 60 * 60000)
  const conflict = await Booking.findOne({
    panditId,
    scheduledAt: { $gte: slotStart, $lte: slotEnd },
    status: { $in: ['requested', 'confirmed'] },
  })
  if (conflict) return { error: 'This Pandit is not available at the selected time. Please choose another slot.' }

  // Warn if address is outside service areas (non-blocking for MVP)
  const inServiceArea = pandit.serviceAreas.some(
    (area: string) => address.city.toLowerCase().includes(area.toLowerCase()) ||
                      address.pincode.startsWith(area.slice(0, 3))
  )

  const booking = await Booking.create({
    customerId: session.user.id,
    panditId,
    poojaId,
    scheduledAt,
    timezone,
    address,
    status: 'requested',
    expiresAt: new Date(Date.now() + SLA_HOURS * 3600000),
  })

  // Notify pandit (Phase 9 implements full email)
  notifyPanditNewRequest(panditId, booking._id.toString()).catch(console.error)

  return {
    success: true,
    bookingId: booking._id.toString(),
    warning: !inServiceArea ? 'This address may be outside the Pandit\'s usual service area.' : null,
  }
}

export async function respondToBooking(bookingId: string, action: 'accept' | 'decline') {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }

  await connectDB()
  const booking = await Booking.findById(bookingId)
  if (!booking) return { error: 'Booking not found' }

  // Verify this pandit owns the booking
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit || booking.panditId.toString() !== pandit._id.toString()) {
    return { error: 'Unauthorized' }
  }
  if (booking.status !== 'requested') return { error: `Cannot ${action} a booking in ${booking.status} state` }
  if (booking.expiresAt < new Date()) return { error: 'Booking has already expired' }

  const newStatus = action === 'accept' ? 'confirmed' : 'declined'
  await Booking.updateOne({ _id: bookingId }, { status: newStatus, respondedAt: new Date() })

  // Update pandit response rate
  await updateResponseRate(pandit._id.toString())

  // Notify customer
  notifyCustomerResponse(booking.customerId.toString(), bookingId, newStatus).catch(console.error)

  return { success: true, status: newStatus }
}

export async function cancelBooking(bookingId: string, reason: string) {
  const session = await auth()
  if (!session) return { error: 'Unauthorized' }

  if (!reason?.trim() || reason.length < 5) return { error: 'Please provide a cancellation reason' }

  await connectDB()
  const booking = await Booking.findById(bookingId)
  if (!booking) return { error: 'Not found' }

  // Check ownership
  const pandit = session.user.role === 'pandit'
    ? await Pandit.findOne({ userId: session.user.id })
    : null

  const isCustomer = session.user.role === 'customer' && booking.customerId.toString() === session.user.id
  const isPandit = pandit && booking.panditId.toString() === pandit._id.toString()
  const isAdmin = session.user.role === 'admin'

  if (!isCustomer && !isPandit && !isAdmin) return { error: 'Unauthorized' }
  if (!['requested', 'confirmed'].includes(booking.status)) {
    return { error: `Cannot cancel a booking in ${booking.status} state` }
  }

  await Booking.updateOne({ _id: bookingId }, {
    status: 'cancelled',
    cancellation: { by: session.user.id, reason: reason.trim(), at: new Date() },
  })

  return { success: true }
}

export async function markBookingCompleted(bookingId: string) {
  const session = await auth()
  if (!session || !['pandit', 'admin'].includes(session.user.role)) return { error: 'Unauthorized' }

  await connectDB()
  const booking = await Booking.findById(bookingId)
  if (!booking || booking.status !== 'confirmed') return { error: 'Booking must be confirmed to mark complete' }

  if (session.user.role === 'pandit') {
    const pandit = await Pandit.findOne({ userId: session.user.id })
    if (!pandit || booking.panditId.toString() !== pandit._id.toString()) return { error: 'Unauthorized' }
  }

  await Booking.updateOne({ _id: bookingId }, { status: 'completed' })
  await Pandit.updateOne({ _id: booking.panditId }, { $inc: { completedBookings: 1 } })

  // Send review request to customer (Phase 9)
  sendReviewRequest(booking.customerId.toString(), bookingId).catch(console.error)

  return { success: true }
}

async function updateResponseRate(panditId: string) {
  const { Booking } = await import('@/lib/db/models/Booking')
  const total = await Booking.countDocuments({ panditId, status: { $in: ['confirmed','declined','completed','cancelled'] } })
  const responded = await Booking.countDocuments({ panditId, respondedAt: { $exists: true }, status: { $ne: 'expired' } })
  const rate = total > 0 ? responded / total : 0
  await Pandit.updateOne({ _id: panditId }, { responseRate: Math.round(rate * 100) / 100 })
}

async function notifyPanditNewRequest(panditId: string, bookingId: string) {}
async function notifyCustomerResponse(customerId: string, bookingId: string, status: string) {}
async function sendReviewRequest(customerId: string, bookingId: string) {}
```

---

### Task 2: Expiry Cron Route (`app/api/cron/expire-bookings/route.ts`)

Called by Vercel cron or external scheduler every 15 minutes.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'

export async function GET(req: NextRequest) {
  // Secure with a cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const result = await Booking.updateMany(
    { status: 'requested', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  )

  // For each expired booking, notify the customer (batch)
  const expired = await Booking.find({
    status: 'expired',
    notificationSent: false,
  }).limit(50)

  // Send notifications (Phase 9 implements Resend)
  await Booking.updateMany(
    { _id: { $in: expired.map(b => b._id) } },
    { notificationSent: true }
  )

  return NextResponse.json({ expired: result.modifiedCount })
}
```

Add to `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/expire-bookings", "schedule": "*/15 * * * *" }]
}
```

---

### Task 3: Booking Flow UI

**BookingWizard.tsx** (`components/booking/BookingWizard.tsx`) — 3 steps:

**Step 1 — Select Date & Time:**
```tsx
// Calendar date picker (no past dates, no dates > 365 days ahead)
// Time slots: 6am–8pm, 30-min intervals
// Show "unavailable" slots (fetch existing confirmed bookings for this pandit)
// Min lead time: 4h from now → disable earlier slots
// Timezone: fixed to Asia/Kolkata (display note)
```

**Step 2 — Address:**
```tsx
// Fields: Line 1, City, State, Pincode (validated regex ^\d{6}$)
// "Use saved address" if customer has one on profile
// Show warning if address outside service area (non-blocking)
```

**Step 3 — Confirm:**
```tsx
// Summary card: Pandit name + photo, Pooja name, Date/time, Address, Price
// "Confirm Booking" button (orange, full-width)
// Loading state on submit
// On success: redirect to /dashboard/customer/bookings/[id]
```

**Availability API** (`/api/bookings/availability`):
```typescript
// GET ?panditId=xxx&date=2024-01-15
// Returns array of booked time slots for that date
// Used to mark slots as unavailable in the calendar
```

---

### Task 4: Booking Status Pages

**Booking Detail Page** (`app/(customer)/dashboard/bookings/[id]/page.tsx`):
```tsx
// Status badge: requested(yellow) | confirmed(green) | declined(red) | expired(gray) | cancelled(gray) | completed(green)
// Booking details: Pandit, Pooja, Date, Address, Price
// Actions based on status:
//   requested: "Cancel" button
//   confirmed: "Cancel" button + "Mark Complete" (if date passed)
//   completed: "Write Review" button (if no review yet)
//   expired: "Rebook" link → /search?q=<pooja>
```

**BookingCard.tsx** (`components/shared/BookingCard.tsx`):
```tsx
// Compact card for dashboard listing
// Shows: Pandit photo + name, Pooja, date, status badge, primary action
```

---

### Task 5: Status Badge Component

```tsx
// components/shared/StatusBadge.tsx
const STATUS_CONFIG = {
  requested:  { label: 'Pending',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  confirmed:  { label: 'Confirmed', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200'  },
  declined:   { label: 'Declined',  bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200'    },
  expired:    { label: 'Expired',   bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200'   },
  cancelled:  { label: 'Cancelled', bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200'   },
  completed:  { label: 'Completed', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200'   },
}
// Render as pill: rounded-full, text-xs font-medium, px-2.5 py-0.5
```

---

### Task 6: Acceptance Criteria

- [ ] Attempting to book a slot with a confirmed booking for that pandit returns conflict error
- [ ] Booking a past date is blocked at both client and server validation
- [ ] SLA expiry: booking auto-moves to `expired` after configured hours (tested via mock date)
- [ ] `cancelBooking` records `{ by, reason, at }` — never just sets cancelled without reason
- [ ] Only the booking's customer can cancel from customer side; only the booking's pandit can accept/decline
- [ ] `markBookingCompleted` increments `pandit.completedBookings`
- [ ] After completion, "Write Review" CTA appears; it's hidden for all other statuses
- [ ] Expired booking shows "Rebook" link back to search
- [ ] Calendar disables past dates and dates > 1 year ahead visually
- [ ] Timezone stored with booking; displayed in user's locale
- [ ] Multiple bookings for same slot by same customer are allowed (they are warned); confirming one does NOT auto-cancel others
- [ ] Admin can cancel any booking with a reason (override)
