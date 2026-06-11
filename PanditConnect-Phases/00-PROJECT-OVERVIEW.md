# PanditConnect — Master Implementation Blueprint
> Version 1.0 | Claude Code Production Prompt Series | June 2026

## Project Summary
Multi-sided marketplace connecting devotees with verified Pandits for poojas, sanskars & religious ceremonies.

**Stack:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui | MongoDB Atlas | NextAuth.js | Cloudinary | Resend | Vercel

**Design:** White background · Orange primary (`#F97316`) · Neutral grays · Stripe/Linear/Calendly inspired · Mobile-first · No glassmorphism, no heavy gradients

---

## Token Budget Strategy
Each phase is self-contained with a single Claude Code prompt. Estimated tokens per phase: 4k–8k. Total: ~60–80k for complete project.

| Phase | File | Focus | Est. Tokens |
|-------|------|--------|-------------|
| 1 | 01-FOUNDATION.md | Project setup, auth, RBAC | ~8k |
| 2 | 02-PANDIT-REGISTRATION.md | Pandit onboarding + verification | ~7k |
| 3 | 03-SEARCH-DISCOVERY.md | Search, ranking engine | ~7k |
| 4 | 04-BOOKING-SYSTEM.md | Booking state machine | ~8k |
| 5 | 05-REVIEW-SYSTEM.md | Reviews + Bayesian ranking | ~7k |
| 6 | 06-CUSTOMER-DASHBOARD.md | Customer portal | ~6k |
| 7 | 07-PANDIT-DASHBOARD.md | Pandit portal | ~7k |
| 8 | 08-ADMIN-PANEL.md | Admin verification + moderation | ~7k |
| 9 | 09-NOTIFICATIONS-I18N.md | Email + i18n (hi/gu/en) | ~5k |
| 10 | 10-PRODUCTION-HARDENING.md | Security, perf, monitoring | ~5k |

---

## Folder Structure (target)
```
panditconnect/
├── app/
│   ├── (public)/          # Landing, search, pandit profiles
│   ├── (auth)/            # Login, register, OTP
│   ├── (customer)/        # Customer dashboard
│   ├── (pandit)/          # Pandit dashboard
│   └── (admin)/           # Admin panel
├── components/
│   ├── ui/                # shadcn primitives
│   └── shared/            # PanditCard, BookingCard, ReviewCard, etc.
├── lib/
│   ├── db/                # MongoDB connection + models
│   ├── auth/              # NextAuth config
│   ├── ranking/           # Scoring engine
│   └── validators/        # Zod schemas
├── actions/               # Server Actions
├── hooks/                 # Client hooks
├── locales/               # hi.json, gu.json, en.json
└── types/                 # Global TypeScript types
```

---

## Global Design Tokens (use in every phase)
```ts
// tailwind.config.ts additions
colors: {
  primary: { DEFAULT: '#F97316', hover: '#EA6C0A', light: '#FFF7ED' },
  neutral: { 50:'#F9FAFB', 100:'#F3F4F6', 200:'#E5E7EB', 600:'#4B5563', 900:'#111827' }
}
```

## Database: MongoDB Collections
`users` · `pandits` · `poojas` · `materials` · `bookings` · `reviews` · `payments`

## Auth Roles
`customer` | `pandit` | `admin`  — enforced server-side on every API route + Server Action.

---

## How to Use These Files
1. Open Claude Code in the project root.
2. Paste the prompt from each phase file in order.
3. Each prompt is self-contained — it references prior output by file path only.
4. Run `pnpm install && pnpm dev` after Phase 1 to verify baseline before proceeding.
