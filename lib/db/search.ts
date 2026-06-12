import mongoose from 'mongoose'
import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { POOJA_CATALOGUE } from '@/types'
import type { PanditSearchResultDTO } from '@/types/dashboard'

export interface PanditSearchParams {
  q?: string
  pooja?: string
  area?: string
  lang?: string
  minRating?: string
  maxPrice?: string
}

// Resolve the effective search text. Supports the legacy ?pooja=<catalog-key>
// URLs (e.g. ?pooja=satyanarayan-katha) by mapping the key to the catalogue
// name so it matches the regex search over Pooja.name.
export function resolveSearchQuery(params: PanditSearchParams): string {
  const q = params.q?.trim()
  if (q) return q
  const pooja = params.pooja?.trim()
  if (!pooja) return ''
  const entry = POOJA_CATALOGUE.find((p) => p.key === pooja.toLowerCase())
  return entry ? entry.name : pooja.replace(/-/g, ' ')
}

// Cached variant — results are shared across visitors for 60s, so repeated
// identical searches (and back-navigation) skip the DB entirely. The key is
// built from the individual params to be independent of object key order.
export function searchVerifiedPanditsCached(params: PanditSearchParams): Promise<PanditSearchResultDTO[]> {
  const key = [params.q, params.pooja, params.area, params.lang, params.minRating, params.maxPrice]
    .map((v) => v ?? '')
    .join('|')
  return unstable_cache(() => searchVerifiedPandits(params), ['pandit-search', key], {
    revalidate: 60,
    tags: ['search'],
  })()
}

// Public search over verified Pandits — no auth required. Shared by the public
// /search page and the customer-dashboard search action.
export async function searchVerifiedPandits(params: PanditSearchParams): Promise<PanditSearchResultDTO[]> {
  try {
    await connectDB()
    const q = resolveSearchQuery(params)
    if (!q) return []

    // Escape user input so it can't break the regex.
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const poojaFilter: Record<string, unknown> = { active: true, name: { $regex: escaped, $options: 'i' } }
    const maxPrice = Number(params.maxPrice)
    if (maxPrice > 0) poojaFilter.price = { $lte: maxPrice }

    const poojas = await Pooja.find(poojaFilter).select('panditId name price').lean()
    if (poojas.length === 0) return []

    // Group matched poojas by pandit → starting price + matched names.
    const byPandit = new Map<string, { startingPrice: number; names: string[] }>()
    for (const p of poojas) {
      const key = String(p.panditId)
      const entry = byPandit.get(key)
      if (!entry) byPandit.set(key, { startingPrice: p.price, names: [p.name] })
      else {
        entry.startingPrice = Math.min(entry.startingPrice, p.price)
        if (!entry.names.includes(p.name)) entry.names.push(p.name)
      }
    }

    const panditFilter: Record<string, unknown> = {
      _id: { $in: [...byPandit.keys()].map((id) => new mongoose.Types.ObjectId(id)) },
      verificationStatus: 'verified',
    }
    if (params.lang) panditFilter.languages = params.lang
    const minRating = Number(params.minRating)
    if (minRating > 0) panditFilter.ratingAvg = { $gte: minRating }
    if (params.area?.trim()) {
      const areaEscaped = params.area.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      panditFilter.serviceAreas = { $regex: areaEscaped, $options: 'i' }
    }

    const pandits = await Pandit.find(panditFilter)
      .sort({ ratingWeighted: -1, completedBookings: -1 })
      .limit(20)
      .populate<{ userId: { name?: string } }>('userId', 'name')
      .lean()

    return pandits.map((p) => {
      const matched = byPandit.get(String(p._id))
      return {
        _id: String(p._id),
        name: p.userId?.name ?? 'Pandit Ji',
        ratingAvg: p.ratingAvg ?? 0,
        ratingCount: p.ratingCount ?? 0,
        verificationStatus: p.verificationStatus,
        specialization: p.specialization ?? [],
        languages: p.languages ?? [],
        experienceYears: p.experienceYears ?? 0,
        serviceAreas: p.serviceAreas ?? [],
        startingPrice: matched?.startingPrice ?? 0,
        matchedPoojas: matched?.names ?? [],
      }
    })
  } catch (e) {
    console.error('[search] searchVerifiedPandits failed', e)
    return []
  }
}
