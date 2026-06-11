# PanditConnect — RBAC Matrix & Edge Cases Reference
> Quick reference card for Claude Code development

---

## RBAC Permission Matrix

| Action | Customer | Pandit | Admin |
|--------|----------|--------|-------|
| Register / manage own account | ✅ | ✅ | ✅ |
| Search & view Pandit profiles | ✅ | View only | ✅ |
| Create a booking | ✅ | ❌ | On behalf |
| Cancel own booking | ✅ | ❌ | Override |
| Accept / decline booking | ❌ | ✅ own | Override |
| Mark booking complete | ❌ | ✅ own | ✅ |
| Submit a review | ✅ (own completed) | ❌ | ❌ |
| Respond to review | ❌ | ✅ (own reviews) | ❌ |
| Flag a review | ✅ | ✅ | ✅ |
| Moderate reviews | ❌ | ❌ | ✅ |
| Add/edit/delete own services | ❌ | ✅ | ✅ |
| Verify Pandit identity | ❌ | ❌ | ✅ |
| Suspend / delete users | ❌ | ❌ | ✅ |
| View own revenue | ❌ | ✅ | ✅ all |
| View platform analytics | ❌ | ❌ | ✅ |

**Rule:** Authorization enforced server-side on every API route and Server Action. Client never decides permissions.

---

## Edge Cases — Quick Reference

### Authentication
| Scenario | Behaviour |
|----------|-----------|
| Duplicate email/phone on register | Error: "Account exists. Please log in." — never say which field |
| OTP expired | Reject; allow resend after cooldown |
| OTP max attempts reached | Temp lockout; "Request a new OTP" |
| Suspended user tries to log in | Auth rejected with explanation |
| Same person as customer + pandit | Two separate accounts on different identifiers |

### Booking
| Scenario | Behaviour |
|----------|-----------|
| Double-booking same slot | Atomic conflict check; second rejected with alternatives |
| Past date | Blocked at validation (client + server) |
| Pandit never responds | Auto-Expire at SLA; notify customer; prompt rebook |
| Address outside service area | Warning (non-blocking); shown before confirm |
| Customer books multiple pandits for same slot | Allowed; warning shown; confirming one does NOT auto-cancel others |

### Reviews
| Scenario | Behaviour |
|----------|-----------|
| Review before completion | CTA hidden + server blocks |
| Second review same booking | Edits existing (within 7-day window) |
| Review after 30 days | Blocked; customer informed |
| Self-review | Customer==Pandit check; rejected server-side |
| Account deleted | Reviews anonymised "Verified customer" — never deleted |
| New pandit 0 reviews | Show "New on PanditConnect" — NEVER "0.0 ★" |

### Ranking
| Scenario | Behaviour |
|----------|-----------|
| Brand-new pandit | Platform-mean prior + 0.05 boost for 30 days |
| Missing signal (responseRate null) | Treat as neutral/0 — never crash |
| Equal scores | Tie-break: responseRate → recency → stable id |
| Weight config changed | Ordering changes without code deploy |

### Data Integrity
| Scenario | Behaviour |
|----------|-----------|
| Delete pandit | Soft-delete; poojas unlisted; bookings retained |
| Delete pooja with active bookings | Block hard delete; unlist only |
| Rating cache stale | Recomputed on every review change; daily reconciliation cron |
| Concurrent writes | Optimistic concurrency via updatedAt; stale write rejected |

### Infrastructure
| Scenario | Behaviour |
|----------|-----------|
| MongoDB 512MB limit | Alert at 80%; defined upgrade trigger |
| Resend email cap | Queue non-critical; always send transactional |
| Cloudinary quota | Graceful fallback (placeholder); alert |
| Third-party outage | Degrade gracefully; queue; show placeholders |

---

## Design System Cheat Sheet

```css
/* Colors */
--primary: #F97316;          /* orange-500 */
--primary-hover: #EA6C0A;    /* orange-600 */
--primary-light: #FFF7ED;    /* orange-50 */
--surface: #F9FAFB;          /* gray-50 */
--border: #E5E7EB;            /* gray-200 */
--text: #111827;              /* gray-900 */
--text-muted: #6B7280;        /* gray-500 */

/* Spacing: 4px grid (Tailwind default) */
/* Border radius: rounded-lg (8px) cards, rounded-md (6px) inputs */
/* Font: Inter */

/* Buttons */
.btn-primary: bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-medium
.btn-outline: border border-gray-200 hover:border-gray-300 rounded-md px-4 py-2 text-sm
.btn-ghost: hover:bg-gray-50 rounded-md px-4 py-2 text-sm text-gray-600

/* Cards */
.card: bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow

/* Status badges */
.badge-yellow: bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs px-2.5 py-0.5
.badge-green: bg-green-50 text-green-700 border border-green-200 rounded-full text-xs px-2.5 py-0.5
.badge-red: bg-red-50 text-red-700 border border-red-200 rounded-full text-xs px-2.5 py-0.5
.badge-gray: bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs px-2.5 py-0.5
.badge-blue: bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs px-2.5 py-0.5
```

---

## API Route Summary

```
POST /api/auth/register       → registerUser()
POST /api/auth/verify-otp     → verifyOTP()
POST /api/auth/resend-otp     → resendOTP()

GET  /api/search              → Search + Ranking engine
GET  /api/pandits/[id]        → Public pandit profile
GET  /api/bookings/availability → Available slots for pandit+date

POST /api/bookings            → createBooking()
PATCH /api/bookings/[id]      → respondToBooking / cancelBooking / markComplete

POST /api/reviews             → createReview()
POST /api/reviews/[id]/reply  → addPanditReply()
POST /api/reviews/[id]/flag   → flagReview()

POST /api/admin/verify        → Approve/reject pandit
POST /api/admin/reviews/[id]  → Moderate review
POST /api/admin/users/[id]    → Suspend/restore/delete

GET  /api/cron/expire-bookings  → Auto-expire SLA (cron)
GET  /api/cron/recompute-ratings → Daily rating sync (cron)
```

---

## MongoDB Index Summary

```javascript
// users
{ email: 1 }  unique
{ phone: 1 }  unique
{ status: 1 }

// pandits
{ userId: 1 }  unique
{ verificationStatus: 1 }
{ serviceAreas: 1 }
{ ratingWeighted: -1 }

// poojas
{ panditId: 1 }
{ catalogKey: 1 }
{ panditId: 1, active: 1 }

// bookings
{ panditId: 1, scheduledAt: 1, status: 1 }  // conflict check
{ customerId: 1, status: 1 }
{ status: 1, expiresAt: 1 }  // expiry cron

// reviews
{ bookingId: 1 }  unique
{ panditId: 1, status: 1 }
{ customerId: 1 }
```
