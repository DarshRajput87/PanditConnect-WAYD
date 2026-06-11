# Phase 9 — Notifications & Internationalisation
> Claude Code Prompt · Requires Phase 1–8 complete

---

## PROMPT START (Phase 9)

Build Phase 9: complete transactional email notifications via Resend, and full i18n for Hindi, Gujarati, and English.

---

### Task 1: Notification Service (`lib/notifications/email.ts`)

Every booking state transition emits exactly one email to the relevant party. Idempotent — never send the same notification twice.

```typescript
import { Resend } from 'resend'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'PanditConnect <noreply@panditconnect.in>'

// Template engine — plain text (free-tier friendly, no HTML templates needed for MVP)
function template(type: NotificationType, data: Record<string, string>, lang: 'hi' | 'gu' | 'en' = 'en'): { subject: string; text: string } {
  const T: Record<string, Record<string, { subject: string; text: string }>> = {
    BOOKING_REQUEST: {
      en: {
        subject: `New Booking Request — ${data.poojaName}`,
        text: `Namaste ${data.panditName},\n\nYou have a new booking request from ${data.customerName}.\n\nPooja: ${data.poojaName}\nDate: ${data.date}\nAddress: ${data.address}\n\nPlease respond within ${data.slaHours} hours.\n\nLog in to respond: ${data.dashboardUrl}`,
      },
      hi: {
        subject: `नई बुकिंग अनुरोध — ${data.poojaName}`,
        text: `नमस्ते ${data.panditName},\n\n${data.customerName} से ${data.poojaName} के लिए नई बुकिंग अनुरोध आया है।\n\nतिथि: ${data.date}\nपता: ${data.address}\n\nकृपया ${data.slaHours} घंटे के भीतर जवाब दें।`,
      },
      gu: {
        subject: `નવી બુકિંગ વિનંતી — ${data.poojaName}`,
        text: `નમસ્તે ${data.panditName},\n\n${data.customerName} પાસેથી ${data.poojaName} માટે નવી બુકિંગ વિનંતી.\n\nતારીખ: ${data.date}\nસરનામું: ${data.address}\n\nકૃપા કરીને ${data.slaHours} કલાકની અંદર જવાબ આપો.`,
      },
    },
    BOOKING_CONFIRMED: {
      en: {
        subject: `Booking Confirmed — ${data.poojaName} on ${data.date}`,
        text: `Namaste ${data.customerName},\n\nYour booking has been confirmed!\n\nPandit: ${data.panditName}\nPooja: ${data.poojaName}\nDate: ${data.date}\nAddress: ${data.address}\n\nView booking: ${data.bookingUrl}`,
      },
      hi: { subject: `बुकिंग पुष्टि — ${data.poojaName}`, text: `नमस्ते ${data.customerName},\n\nआपकी बुकिंग की पुष्टि हो गई है!\n\nपंडित: ${data.panditName}\nपूजा: ${data.poojaName}\nतारीख: ${data.date}` },
      gu: { subject: `બુકિંગ પુષ્ટિ — ${data.poojaName}`, text: `નમસ્તે ${data.customerName},\n\nતમારી બુકિંગ confirmed છે!\n\nPandit: ${data.panditName}\nPuja: ${data.poojaName}\nDate: ${data.date}` },
    },
    BOOKING_DECLINED: {
      en: { subject: `Booking Declined`, text: `Namaste ${data.customerName},\n\nUnfortunately your booking request for ${data.poojaName} on ${data.date} was declined. We recommend browsing other Pandits.\n\nFind another Pandit: ${data.searchUrl}` },
      hi: { subject: `बुकिंग अस्वीकार`, text: `नमस्ते ${data.customerName},\n\nखेद है, आपकी ${data.poojaName} बुकिंग अस्वीकार कर दी गई। कृपया अन्य पंडित खोजें।` },
      gu: { subject: `બુકિંગ નકારી`, text: `નમસ્તે ${data.customerName},\n\nખેદ છે, ${data.poojaName} ની બુકિંગ નકારી. બીજા Pandit શોધો.` },
    },
    BOOKING_EXPIRED: {
      en: { subject: `Booking Request Expired`, text: `Namaste ${data.customerName},\n\nYour booking request for ${data.poojaName} on ${data.date} expired without a response. Please try booking another Pandit.\n\n${data.searchUrl}` },
      hi: { subject: `बुकिंग अनुरोध समाप्त`, text: `नमस्ते ${data.customerName},\n\nआपका ${data.poojaName} अनुरोध समाप्त हो गया। कृपया दूसरे पंडित खोजें।` },
      gu: { subject: `બુકિંગ વિનંતી Expired`, text: `નમસ્તે ${data.customerName},\n\nBuking expired. બીજા Pandit ખોજો.` },
    },
    BOOKING_COMPLETED_REVIEW: {
      en: { subject: `How was your ${data.poojaName}? Leave a Review`, text: `Namaste ${data.customerName},\n\nWe hope your ${data.poojaName} with ${data.panditName} was wonderful!\n\nShare your experience: ${data.reviewUrl}` },
      hi: { subject: `${data.poojaName} कैसी रही? समीक्षा लिखें`, text: `नमस्ते ${data.customerName},\n\nआपकी ${data.poojaName} कैसी रही? ${data.panditName} को रेटिंग दें।\n\n${data.reviewUrl}` },
      gu: { subject: `${data.poojaName} કેવી રહી? Review આપો`, text: `નમસ્તે ${data.customerName},\n\n${data.poojaName} review: ${data.reviewUrl}` },
    },
    VERIFICATION_APPROVED: {
      en: { subject: `Profile Verified — You're Live on PanditConnect!`, text: `Namaste ${data.panditName},\n\nCongratulations! Your profile has been verified and is now live.\n\nDevotees can now find and book you. Manage your bookings: ${data.dashboardUrl}` },
      hi: { subject: `प्रोफ़ाइल सत्यापित — PanditConnect पर लाइव!`, text: `नमस्ते ${data.panditName},\n\nबधाई! आपकी प्रोफ़ाइल सत्यापित हो गई है।` },
      gu: { subject: `Profile Verified — PanditConnect Live!`, text: `નમસ્તે ${data.panditName},\n\nAভિनंदन! Profile verified.` },
    },
    VERIFICATION_REJECTED: {
      en: { subject: `Verification Update`, text: `Namaste ${data.panditName},\n\nYour verification could not be approved.\n\nReason: ${data.reason}\n\nPlease update your profile and resubmit: ${data.profileUrl}` },
      hi: { subject: `सत्यापन अपडेट`, text: `नमस्ते ${data.panditName},\n\nआपका सत्यापन अस्वीकार हुआ। कारण: ${data.reason}` },
      gu: { subject: `Verification Update`, text: `નમસ્તે ${data.panditName},\n\nVerification rejected. Reason: ${data.reason}` },
    },
  }
  return T[type]?.[lang] || T[type]?.['en'] || { subject: 'PanditConnect', text: '' }
}

type NotificationType = keyof typeof template extends (...args: any[]) => any ? never : string

export async function sendBookingRequestToPanel(bookingId: string) {
  await connectDB()
  const booking = await Booking.findById(bookingId).populate('customerId panditId poojaId')
  if (!booking) return
  const pandit = booking.panditId as any
  const user = await User.findById(pandit.userId)
  if (!user?.email) return
  
  const t = template('BOOKING_REQUEST', {
    panditName: user.name, customerName: (booking.customerId as any).name,
    poojaName: (booking.poojaId as any).name,
    date: new Date(booking.scheduledAt).toLocaleDateString('en-IN', { timeZone: booking.timezone }),
    address: `${booking.address.city}, ${booking.address.state}`,
    slaHours: process.env.BOOKING_SLA_HOURS || '2',
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pandit/inquiries`,
  }, user.preferredLanguage)
  
  await resend.emails.send({ from: FROM, to: user.email, subject: t.subject, text: t.text })
}

export async function sendBookingConfirmedToCustomer(bookingId: string) { /* similar pattern */ }
export async function sendBookingDeclinedToCustomer(bookingId: string) { /* similar pattern */ }
export async function sendBookingExpiredToCustomer(bookingId: string) { /* similar pattern */ }
export async function sendReviewRequestToCustomer(bookingId: string) { /* similar pattern */ }
export async function sendVerificationApproved(panditId: string) { /* similar pattern */ }
export async function sendVerificationRejected(panditId: string, reason: string) { /* similar pattern */ }
```

---

### Task 2: Wire Notifications to Events

Replace placeholder `notifyXxx()` calls in prior phases with real notification functions:

| Event | File | Replace |
|-------|------|---------|
| Booking created | `actions/booking.ts` | `notifyPanditNewRequest` → `sendBookingRequestToPanel` |
| Booking confirmed | `actions/booking.ts` | `notifyCustomerResponse(confirmed)` → `sendBookingConfirmedToCustomer` |
| Booking declined | `actions/booking.ts` | `notifyCustomerResponse(declined)` → `sendBookingDeclinedToCustomer` |
| Booking expired (cron) | `app/api/cron/expire-bookings` | `sendBookingExpiredToCustomer` |
| Booking completed | `actions/booking.ts` | `sendReviewRequest` → `sendReviewRequestToCustomer` |
| Pandit approved | `app/api/admin/verify` | `sendVerificationApproved` |
| Pandit rejected | `app/api/admin/verify` | `sendVerificationRejected` |

All notification sends are fire-and-forget (`.catch(console.error)`) — a notification failure must NEVER block the main booking action.

---

### Task 3: i18n Setup (`lib/i18n/`)

**`lib/i18n/config.ts`:**
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, gu: { translation: gu } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
```

**Full locale key structure (`locales/en.json`):**
```json
{
  "nav": { "findPandit": "Find Pandit", "login": "Log in", "register": "Get Started", "signOut": "Sign out", "dashboard": "Dashboard" },
  "landing": {
    "hero": "Book Trusted Pandit Ji — Online",
    "sub": "Verified Pandits for Poojas, Sanskars & Religious Ceremonies",
    "cta": "Find a Pandit",
    "trust1": "Verified Pandits", "trust2": "Transparent Pricing", "trust3": "Samagri List Included",
    "howTitle": "How it works",
    "step1": "Search your Pooja", "step2": "Compare & Book", "step3": "Ceremony Done"
  },
  "search": { "placeholder": "Search by pooja (e.g. Satyanarayan Katha)", "areaPlaceholder": "City or Pincode", "filter": "Filters", "sort": "Sort", "results": "{{count}} Pandits found", "noResults": "No Pandits found", "noResultsSub": "Try a different area or pooja type", "notifyMe": "Notify Me When Available" },
  "pandit": { "experience": "{{n}} years experience", "startingFrom": "Starting from ₹{{price}}", "bookNow": "Book Now", "viewProfile": "View Profile", "verified": "Verified", "newOnPlatform": "New on PanditConnect", "reviews": "{{count}} reviews", "noReviews": "Be the first to review", "sampraday": "Sampraday", "languages": "Languages", "serves": "Serves" },
  "booking": { "selectDate": "Select Date", "selectTime": "Select Time", "address": "Address", "confirm": "Confirm Booking", "cancel": "Cancel Booking", "cancelReason": "Reason for cancellation", "accept": "Accept", "decline": "Decline", "markComplete": "Mark as Complete", "writeReview": "Write a Review", "rebook": "Book Again" },
  "review": { "title": "How was your experience?", "overall": "Overall", "ritualKnowledge": "Ritual Knowledge", "punctuality": "Punctuality", "behaviour": "Behaviour", "communication": "Communication", "commentLabel": "Share your experience (optional)", "submit": "Submit Review", "edit": "Edit Review", "reply": "Reply", "replyLabel": "Add your response" },
  "status": { "requested": "Pending", "confirmed": "Confirmed", "declined": "Declined", "expired": "Expired", "cancelled": "Cancelled", "completed": "Completed" },
  "auth": { "loginTitle": "Welcome back", "registerTitle": "Create your account", "email": "Email", "password": "Password", "name": "Full Name", "phone": "Mobile Number", "role": "I am a", "customer": "Devotee", "pandit": "Pandit Ji", "otpSent": "OTP sent to your email", "verifyOtp": "Verify OTP", "resendOtp": "Resend OTP", "otpLabel": "Enter 6-digit OTP", "forgotPassword": "Forgot password?", "resetPassword": "Reset Password" },
  "dashboard": { "overview": "Overview", "bookings": "My Bookings", "revenue": "Revenue", "services": "My Services", "reviews": "Reviews", "profile": "My Profile", "settings": "Settings", "inquiries": "Inquiries" },
  "admin": { "verification": "Verification Queue", "moderation": "Review Moderation", "users": "User Management", "analytics": "Analytics", "approve": "Approve", "reject": "Reject", "rejectionReason": "Reason for rejection", "suspend": "Suspend", "restore": "Restore", "delete": "Delete Account" },
  "errors": { "required": "This field is required", "invalidPhone": "Invalid Indian mobile number (+91XXXXXXXXXX)", "minLength": "Must be at least {{n}} characters", "maxLength": "Must be at most {{n}} characters", "unauthorized": "You are not authorized", "notFound": "Not found", "serverError": "Something went wrong. Please try again." },
  "common": { "save": "Save", "cancel": "Cancel", "close": "Close", "loading": "Loading…", "saved": "Saved", "saving": "Saving…", "back": "Back", "next": "Next", "submit": "Submit", "edit": "Edit", "delete": "Delete", "view": "View", "search": "Search", "filter": "Filter", "clearAll": "Clear All" }
}
```

Mirror all keys in `hi.json` (Hindi) and `gu.json` (Gujarati).

**LanguageSwitcher.tsx** (already stubbed in Phase 1 — complete it):
```tsx
'use client'
import { useTranslation } from 'react-i18next'
const LANGS = [{ code: 'en', label: 'EN' }, { code: 'hi', label: 'हि' }, { code: 'gu', label: 'ગુ' }]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  return (
    <div className="flex gap-1 rounded-md border border-gray-200 p-0.5">
      {LANGS.map(({ code, label }) => (
        <button key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === code ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >{label}</button>
      ))}
    </div>
  )
}
```

---

### Phase 9 Acceptance Criteria

- [ ] Every booking state transition sends exactly one email to the relevant party
- [ ] Email failure never blocks booking action (fire-and-forget)
- [ ] Duplicate notifications suppressed: `notificationSent` flag on booking
- [ ] All 3 languages render correctly: EN, हिंदी, ગુjarat
- [ ] Missing translation key falls back to EN — never shows raw key like `auth.loginTitle`
- [ ] Language switch at runtime without page reload
- [ ] Dates in emails formatted correctly for locale (e.g., "15 January 2025" for EN)
- [ ] Aadhaar numbers and phones NOT included in email text
- [ ] Resend free-tier cap: error logged, email queued, main action not blocked

---
---

# Phase 10 — Production Hardening
> Claude Code Prompt · Final phase — complete all hardening before deploy

---

## PROMPT START (Phase 10)

Final phase: security hardening, performance, error monitoring, and production readiness checklist.

---

### Task 1: Security Hardening

**`app/api/[...]/route.ts` — every API route must:**
```typescript
// 1. Verify session server-side (never trust client claims)
// 2. Check role matches required role
// 3. Check ownership (e.g., customer can only access own bookings)
// 4. Validate and sanitize all input with Zod before use
// 5. Never pass unsanitized user input into MongoDB queries

// Rate limiting middleware (add to all public API routes):
import { Ratelimit } from '@upstash/ratelimit'  // or simple in-memory for MVP
// OR simple approach: track in MongoDB with TTL index

// Simple rate limiter (no Redis needed for MVP):
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
// Apply to: /api/auth/* (10/min), /api/search (30/min), /api/reviews (5/min)
```

**Security headers (`next.config.ts`):**
```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: { domains: ['res.cloudinary.com'] },
}
```

---

### Task 2: Error Boundaries & User-Facing Errors

**`app/error.tsx`** (global error boundary):
```tsx
'use client'
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-4">
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500 text-sm">We're working on it. Please try again.</p>
        <button onClick={reset} className="btn-primary">Try again</button>
      </div>
    </div>
  )
}
```

**`app/not-found.tsx`:**
```tsx
// Clean 404: "Page not found" + "Go to Home" link
// If pandit profile: "This Pandit is not available"
```

---

### Task 3: Loading States

Every route group must have a `loading.tsx` with skeleton loaders:

```tsx
// app/(public)/search/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-12 bg-gray-100 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create matching `loading.tsx` for dashboard routes.

---

### Task 4: Input Sanitization (centralized)

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '')                    // strip < >
    .replace(/\b\d{10,12}\b/g, '[removed]') // strip phone/aadhaar
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[removed]') // strip email
    .trim()
    .slice(0, 1000)
}
```

---

### Task 5: Performance

**Image optimization:**
- All `<img>` tags → Next.js `<Image>` component
- Cloudinary URLs: append `?w=400&f_auto&q_auto` for listing cards
- Profile photos: `w=200` for cards, `w=400` for profile page

**MongoDB query optimization audit:**
```typescript
// Verify all hot-path queries use indexes:
// 1. Search: pandit filter uses { verificationStatus, serviceAreas, languages }
// 2. Bookings: customer dashboard uses { customerId, status }
// 3. Reviews: pandit profile uses { panditId, status }
// 4. Conflict check: uses { panditId, scheduledAt, status }
// Add explain() calls in development to verify index usage
```

**Bundle size:**
- Verify recharts is imported selectively: `import { BarChart, Bar, XAxis, YAxis } from 'recharts'`
- Dynamic imports for admin analytics charts (not needed on first load)

---

### Task 6: Environment Validation (`lib/env.ts`)

```typescript
// Validate all required env vars at startup
const required = [
  'MONGODB_URI', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL',
  'RESEND_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
]

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`)
}
```

---

### Task 7: Final Production Checklist

```markdown
## Security
- [ ] All env vars in Vercel dashboard (not in repo)
- [ ] NEXTAUTH_SECRET is 32+ random chars
- [ ] Aadhaar/identity numbers never stored in full
- [ ] Phone numbers not exposed in API responses to other users
- [ ] XSS: all user-generated content escaped on render
- [ ] NoSQL injection: all DB queries use typed Zod-validated inputs
- [ ] Rate limits on auth, OTP, search, review endpoints

## Performance  
- [ ] All images use next/image with correct sizes
- [ ] Cloudinary transforms applied (auto quality, resize)
- [ ] MongoDB indexes verified (run .explain() on slow queries)
- [ ] loading.tsx on every route group
- [ ] No unbounded queries (all paginated, all have .limit())

## Reliability
- [ ] Notification failures don't block booking actions
- [ ] Booking expiry cron runs every 15 minutes
- [ ] Rating recompute cron runs daily
- [ ] DB operations that must be atomic use transactions or optimistic concurrency

## Correctness
- [ ] pnpm tsc --noEmit passes with 0 errors
- [ ] All acceptance criteria from phases 1–9 verified
- [ ] Mobile layout tested at 375px on real device or Chrome DevTools
- [ ] Hindi and Gujarati strings render without truncation

## Free-Tier Limits
- [ ] MongoDB Atlas: alert at 400MB (80% of 512MB free limit)
- [ ] Cloudinary: audit upload sizes, add compression
- [ ] Resend: transactional emails prioritized; non-critical (reminders) queued
- [ ] Vercel: function bundle size < 50MB, timeout < 10s on critical paths

## Deployment
- [ ] vercel.json cron jobs configured
- [ ] .env.example up to date with all required keys
- [ ] CRON_SECRET set in Vercel env vars
- [ ] Preview deploy tested on vercel.app URL before production
```

---

### Phase 10 Acceptance Criteria

- [ ] `pnpm build` completes without errors
- [ ] `pnpm tsc --noEmit` passes with 0 type errors
- [ ] Security headers present in HTTP response (verify with securityheaders.com)
- [ ] Error boundary shows user-friendly page (no stack traces) in production
- [ ] All routes have skeleton loading states
- [ ] Mobile layout fully functional at 375px viewport
- [ ] All acceptance criteria from phases 1–9 green
