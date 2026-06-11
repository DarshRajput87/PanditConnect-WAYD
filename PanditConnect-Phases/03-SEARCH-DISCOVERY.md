# Phase 3 — Search & Discovery + Ranking Engine
> Claude Code Prompt · Requires Phase 1–2 complete

---

## PROMPT START

Build Phase 3: the complete search & discovery system including the weighted ranking engine, search page, and Pandit public profile page.

### Context from Prior Phases
- All models exist: `User`, `Pandit`, `Pooja`, `Material`, `Booking`, `Review`
- Verified pandits: `verificationStatus: 'verified'`
- POOJA_CATALOGUE is defined in `types/index.ts`

---

### Task 1: Ranking Engine (`lib/ranking/engine.ts`)

This is the core scoring algorithm. It must be deterministic and configurable via env/config.

```typescript
// Ranking weights — stored as config, tunable without deploy
export const RANKING_WEIGHTS = {
  rating: parseFloat(process.env.RANK_W_RATING || '0.40'),
  bookings: parseFloat(process.env.RANK_W_BOOKINGS || '0.25'),
  experience: parseFloat(process.env.RANK_W_EXPERIENCE || '0.20'),
  responseRate: parseFloat(process.env.RANK_W_RESPONSE || '0.10'),
  recency: parseFloat(process.env.RANK_W_RECENCY || '0.05'),
}

// Bayesian weighted rating (WR = (v/(v+m))*R + (m/(v+m))*C)
export function bayesianRating(R: number, v: number, C: number, m = 5): number {
  if (v === 0) return C  // no reviews → platform mean
  return (v / (v + m)) * R + (m / (v + m)) * C
}

// Normalize value to 0–1 range
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

// Log-scale normalization for bookings (diminishing returns)
function normalizeLog(value: number, maxValue: number): number {
  if (maxValue === 0) return 0
  return Math.log1p(value) / Math.log1p(maxValue)
}

// Recency score: 1.0 = active today, decays over 30 days
function recencyScore(lastActiveAt: Date | null): number {
  if (!lastActiveAt) return 0
  const daysSince = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, 1 - daysSince / 30)
}

export interface RankInput {
  panditId: string
  ratingAvg: number        // raw mean (0 if no reviews)
  ratingCount: number
  completedBookings: number
  experienceYears: number
  responseRate: number     // 0–1
  lastActiveAt: Date | null
  isNewPandit: boolean     // joined < 30 days ago
}

export interface RankResult extends RankInput {
  score: number
  bayesianRating: number
}

export function computeRankings(pandits: RankInput[], platformMeanRating: number): RankResult[] {
  if (!pandits.length) return []

  const maxBookings = Math.max(...pandits.map(p => p.completedBookings), 1)
  const maxExp = Math.max(...pandits.map(p => p.experienceYears), 1)

  const results: RankResult[] = pandits.map(p => {
    const bRating = bayesianRating(p.ratingAvg, p.ratingCount, platformMeanRating)
    const normalizedRating = normalize(bRating, 1, 5)
    const normalizedBookings = normalizeLog(p.completedBookings, maxBookings)
    const normalizedExp = normalize(p.experienceYears, 0, maxExp)
    const normalizedResponse = p.responseRate  // already 0–1
    const normalizedRecency = recencyScore(p.lastActiveAt)

    let score =
      normalizedRating * RANKING_WEIGHTS.rating +
      normalizedBookings * RANKING_WEIGHTS.bookings +
      normalizedExp * RANKING_WEIGHTS.experience +
      normalizedResponse * RANKING_WEIGHTS.responseRate +
      normalizedRecency * RANKING_WEIGHTS.recency

    // New pandit boost: +0.05 for first 30 days (ensures not buried)
    if (p.isNewPandit) score = Math.min(1, score + 0.05)

    return { ...p, score, bayesianRating: bRating }
  })

  // Sort descending; tie-break: responseRate → recency → panditId (stable)
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.001) return b.score - a.score
    if (Math.abs(a.responseRate - b.responseRate) > 0.01) return b.responseRate - a.responseRate
    const aRecency = recencyScore(a.lastActiveAt)
    const bRecency = recencyScore(b.lastActiveAt)
    if (Math.abs(aRecency - bRecency) > 0.01) return bRecency - aRecency
    return a.panditId.localeCompare(b.panditId)  // stable, deterministic
  })

  return results
}

// Recompute and persist Bayesian rating for a single pandit
export async function recomputePanditRating(panditId: string): Promise<void> {
  const { connectDB } = await import('@/lib/db/connect')
  const { Review } = await import('@/lib/db/models/Review')
  const { Pandit } = await import('@/lib/db/models/Pandit')

  await connectDB()

  const agg = await Review.aggregate([
    { $match: { panditId: new (await import('mongoose')).default.Types.ObjectId(panditId), status: 'published' } },
    { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } }
  ])

  const { avg = 0, count = 0 } = agg[0] || {}

  // Platform mean
  const platformAgg = await Review.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: null, mean: { $avg: '$overall' } } }
  ])
  const platformMean = platformAgg[0]?.mean || 4.2

  const wr = bayesianRating(avg, count, platformMean)

  await Pandit.updateOne({ _id: panditId }, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: count,
    ratingWeighted: Math.round(wr * 100) / 100,
  })
}
```

---

### Task 2: Search API Route (`app/api/search/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { computeRankings } from '@/lib/ranking/engine'
import { z } from 'zod'

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),                              // pooja query
  area: z.string().optional(),                                // pincode or city
  lang: z.enum(['hi','gu','en']).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(20).default(10),
})

// Fuzzy map user query to catalogue key
function resolveCatalogKey(query: string): string | null {
  const q = query.toLowerCase().trim()
  const ALIASES: Record<string, string[]> = {
    'satyanarayan-katha': ['satyanarayan', 'katha', 'satya narayan', 'satyanarayana'],
    'griha-pravesh': ['griha pravesh', 'grihapravesh', 'house warming', 'grahpravesh', 'ghar pravesh'],
    'vivah-sanskar': ['vivah', 'wedding', 'marriage', 'shaadi', 'lagan'],
    'rudrabhishek': ['rudrabhishek', 'rudra abhishek', 'shiv pooja'],
    'navchandi-yagna': ['navchandi', 'chandi havan', 'yagna'],
    'ganesh-pooja': ['ganesh', 'ganpati', 'vinayak'],
    'lakshmi-pooja': ['lakshmi', 'laxmi', 'diwali pooja'],
    'vastu-pooja': ['vastu', 'vastu shanti', 'vastu shastra'],
    'mundan-sanskar': ['mundan', 'mundan ceremony', 'head shaving', 'chudakarana'],
    'namkaran': ['namkaran', 'naming ceremony', 'naam karan', 'naamkaran'],
  }
  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (aliases.some(alias => q.includes(alias) || alias.includes(q))) return key
  }
  return null
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = SearchQuerySchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 })

  const { q, area, lang, minRating, maxPrice, page, limit } = parsed.data
  await connectDB()

  const catalogKey = resolveCatalogKey(q)
  
  // Build pooja filter
  const poojaFilter: Record<string, unknown> = { active: true }
  if (catalogKey) poojaFilter.catalogKey = catalogKey
  if (maxPrice) poojaFilter.price = { $lte: maxPrice }
  
  const poojas = await Pooja.find(poojaFilter).select('panditId price').lean()
  const panditIdSet = new Set(poojas.map(p => p.panditId.toString()))

  if (!panditIdSet.size) {
    return NextResponse.json({
      results: [], total: 0, page, catalogKey, suggestedQuery: null,
      message: catalogKey ? null : `Did you mean one of our services? Try "Satyanarayan Katha" or "Griha Pravesh"`,
    })
  }

  // Build pandit filter
  const panditFilter: Record<string, unknown> = {
    _id: { $in: Array.from(panditIdSet) },
    verificationStatus: 'verified',
  }
  if (area) panditFilter.serviceAreas = { $in: [area, new RegExp(area, 'i')] }
  if (lang) panditFilter.languages = lang
  if (minRating) panditFilter.ratingAvg = { $gte: minRating }

  const totalCount = await Pandit.countDocuments(panditFilter)
  const rawPandits = await Pandit.find(panditFilter)
    .populate('userId', 'name')
    .lean()

  // Compute rankings
  const now = new Date()
  const rankInputs = rawPandits.map(p => ({
    panditId: p._id.toString(),
    ratingAvg: p.ratingAvg || 0,
    ratingCount: p.ratingCount || 0,
    completedBookings: p.completedBookings || 0,
    experienceYears: p.experienceYears || 0,
    responseRate: p.responseRate || 0,
    lastActiveAt: p.lastActiveAt || null,
    isNewPandit: (now.getTime() - new Date(p.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000,
  }))

  const ranked = computeRankings(rankInputs, 4.2)
  const paginatedIds = ranked.slice((page - 1) * limit, page * limit).map(r => r.panditId)

  // Build response with starting price per pandit
  const priceMap = new Map<string, number>()
  poojas.forEach(p => {
    const id = p.panditId.toString()
    if (!priceMap.has(id) || p.price < priceMap.get(id)!) priceMap.set(id, p.price)
  })

  const panditMap = new Map(rawPandits.map(p => [p._id.toString(), p]))
  const results = paginatedIds.map(id => {
    const p = panditMap.get(id)!
    const rankedP = ranked.find(r => r.panditId === id)!
    return {
      _id: id,
      name: (p.userId as any)?.name,
      profilePhoto: p.profilePhoto,
      experienceYears: p.experienceYears,
      languages: p.languages,
      serviceAreas: p.serviceAreas,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      verificationStatus: p.verificationStatus,
      startingPrice: priceMap.get(id) || 0,
      score: rankedP.score,
    }
  })

  return NextResponse.json({ results, total: totalCount, page, catalogKey })
}
```

---

### Task 3: Search Page (`app/(public)/search/page.tsx`)

Server + Client hybrid. URL params drive the search state.

**Layout:**
```
┌─ Navbar ─────────────────────────────────┐
│  Search Bar (pooja name input + area)    │
│  Filter strip: Language | Rating | Price │
├──────────────────────────────────────────┤
│  Left: Filter panel (desktop, collapsible)│
│  Right: Results grid                     │
│   - Result count + sort indicator        │
│   - PanditCard × n                       │
│   - Pagination                           │
│  Empty state: suggestions + notify me    │
└──────────────────────────────────────────┘
```

**SearchBar.tsx** (client component):
```tsx
// Controlled input — debounce 300ms before updating URL params
// Show autocomplete dropdown with POOJA_CATALOGUE options
// On selection: navigate to /search?q=<catalogName>&area=<area>
// Mobile: full-width, sticky below navbar
```

**FilterBar.tsx** (client component):
```tsx
// Chips/dropdowns for: Language (hi/gu/en), Min Rating (3+/4+/4.5+), Max Price
// Active filters shown as orange pill chips with × remove
// Mobile: horizontal scroll row
```

**PanditCard.tsx** (`components/shared/PanditCard.tsx`):
```tsx
interface Props {
  pandit: SearchResult
  onBook?: () => void
}

// Layout:
// [Photo 56px] [Name + Verified badge] [Rating stars + count]
// [Experience · Languages] [Service areas]
// [Starting from ₹XXX] [Book Now button (orange)]
// Card: white bg, border-gray-200, rounded-lg, hover:shadow-sm
// Mobile: full width card
// Desktop: grid 2-col or 3-col
```

Star rating display — 5 filled/empty stars, show raw avg (e.g., "4.7") and count ("(23 reviews)"). If count = 0, show "New on PanditConnect" badge (gray pill) — NEVER show "0.0".

---

### Task 4: Pandit Public Profile Page (`app/(public)/pandit/[id]/page.tsx`)

Server component (SSR for SEO).

```
┌─ Profile Header ──────────────────────────┐
│  [Photo 96px] Name [Verified badge]       │
│  Sampraday · X years experience           │
│  Languages: Hindi, Gujarati               │
│  Serves: [area tags]                      │
│  ★ 4.7 (42 reviews)                      │
│  [Book Now] [Call — masked]               │
├─ Services & Pricing ──────────────────────┤
│  [Pooja name] ₹XXX · ~X hrs              │
│  Description + Samagri list (collapsed)   │
├─ Reviews ─────────────────────────────────┤
│  Overall avg + dimension breakdown bars   │
│  Sort: Most Recent | Most Helpful         │
│  ReviewCard × n                           │
│  [Load more]                              │
└───────────────────────────────────────────┘
```

**Data fetching:**
```typescript
// app/(public)/pandit/[id]/page.tsx
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { Review } from '@/lib/db/models/Review'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { id: string } }) {
  // Return SEO metadata with pandit name and services
}

export default async function PanditProfile({ params }: { params: { id: string } }) {
  await connectDB()
  const pandit = await Pandit.findById(params.id).populate('userId', 'name').lean()
  if (!pandit || pandit.verificationStatus !== 'verified') notFound()
  
  const [poojas, reviews] = await Promise.all([
    Pooja.find({ panditId: params.id, active: true }).lean(),
    Review.find({ panditId: params.id, status: 'published' }).sort({ createdAt: -1 }).limit(10)
      .populate('customerId', 'name').lean(),
  ])
  
  const materials = await Material.find({ poojaId: { $in: poojas.map(p => p._id) } }).lean()
  
  // Render profile
}
```

**ReviewCard.tsx** (`components/shared/ReviewCard.tsx`):
```tsx
// Shows: Verified booking badge (green), reviewer name (or "Verified customer")
// Pooja name, date, Overall stars
// Dimension chips: Knowledge ★X · Punctuality ★X · etc.
// Comment text (clamped to 3 lines, expandable)
// Pandit reply (indented, orange-left-border)
```

**RatingBreakdown.tsx:**
```tsx
// Bar chart: 5★(nn%) 4★(nn%) ... 1★(nn%)
// Per-dimension averages: row of label + star count
// Raw average prominently displayed (honest, not Bayesian)
```

---

### Task 5: Empty States

```tsx
// components/shared/EmptyState.tsx
// Props: icon, title, description, action (optional)

// Search empty state (no results for area):
// Title: "No Pandits found in this area yet"
// Description: "Try widening your area or choose a nearby city"
// Action: "Browse all Pandits" link

// Search empty state (no results for pooja):
// Title: "No Pandits available for this pooja"
// Description: "Our network is growing. Notify us and we'll reach out when available."
// Action: "Notify Me" button → collect email (simple form, stored as interest)

// New Pandit (0 reviews):
// In review section: "New on PanditConnect — be the first to review after your pooja"
```

---

### Task 6: Acceptance Criteria

- [ ] `computeRankings` is deterministic: same inputs → same output always
- [ ] Brand-new verified pandit appears in results (not last) due to 0.05 boost
- [ ] Changing `RANK_W_RATING` env var changes ordering without code change
- [ ] Search with misspelled "satya narayan" resolves to Satyanarayan Katha
- [ ] No results → empty state with suggestions, never blank white screen
- [ ] Pandit profile shows raw rating average (not Bayesian) to user
- [ ] Profile of unverified pandit returns 404
- [ ] Filter by language correctly filters by `pandit.languages` array
- [ ] PanditCard "New on PanditConnect" shows when ratingCount === 0 (never "0.0 ★")
- [ ] Search results are paginated, page 2 works correctly
- [ ] Profile page has correct `<title>` and `<meta description>` for SEO
- [ ] Mobile layout works at 375px: cards stack full-width, filters scroll horizontally
