import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { Review } from '@/lib/db/models/Review'
import { PanditProfileSection } from '@/components/customer/PanditProfileSection'
import type { PublicPanditProfileDTO } from '@/types/dashboard'

interface Props {
  params: Promise<{ id: string }>
}

// Shared by generateMetadata and the page — react cache() dedupes the query.
const getVerifiedPandit = cache(async (id: string) => {
  if (!mongoose.isValidObjectId(id)) return null
  await connectDB()
  return Pandit.findOne({ _id: id, verificationStatus: 'verified' })
    .select(
      'userId profilePhoto bio sampraday experienceYears languages serviceAreas specialization verificationStatus ratingAvg ratingCount completedBookings'
    )
    .populate<{ userId: { name?: string } }>('userId', 'name')
    .lean()
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const pandit = await getVerifiedPandit(id)
  if (!pandit) return { title: 'Pandit profile — PanditConnect' }

  const name = pandit.userId?.name ?? 'Pandit Ji'
  const specs = (pandit.specialization ?? []).slice(0, 3).join(', ')
  const rated =
    (pandit.ratingCount ?? 0) > 0
      ? ` Rated ${(pandit.ratingAvg ?? 0).toFixed(1)}/5 by ${pandit.ratingCount} devotees.`
      : ''
  return {
    title: `${name} — Verified Pandit Ji | PanditConnect`,
    description: `Book ${name}${specs ? ` for ${specs}` : ''}. ${pandit.experienceYears ?? 0} years experience.${rated}`,
  }
}

// Public pandit profile — anyone can view; booking is gated at the CTA.
export default async function PublicPanditPage({ params }: Props) {
  const { id } = await params
  const pandit = await getVerifiedPandit(id)
  if (!pandit) notFound()

  const [services, reviews, statsAgg, session] = await Promise.all([
    Pooja.find({ panditId: pandit._id, active: true })
      .sort({ price: 1 })
      .select('name price durationMin description')
      .lean(),
    Review.find({ panditId: pandit._id, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('customerId overall ritualKnowledge punctuality behaviour communication comment createdAt panditReply')
      .populate<{ customerId: { name?: string } }>('customerId', 'name')
      .lean(),
    Review.aggregate<{
      rk: number | null
      punct: number | null
      beh: number | null
      comm: number | null
      dist: number[]
    }>([
      { $match: { panditId: pandit._id, status: 'published' } },
      {
        $group: {
          _id: null,
          rk: { $avg: '$ritualKnowledge' },
          punct: { $avg: '$punctuality' },
          beh: { $avg: '$behaviour' },
          comm: { $avg: '$communication' },
          dist: { $push: '$overall' },
        },
      },
    ]),
    auth(),
  ])

  const materials = await Material.find({ poojaId: { $in: services.map((s) => s._id) } })
    .sort({ createdAt: 1 })
    .select('poojaId itemName quantity notes')
    .lean()
  const materialsByPooja = new Map<string, { itemName: string; quantity: string; notes?: string }[]>()
  for (const m of materials) {
    const key = String(m.poojaId)
    const list = materialsByPooja.get(key) ?? []
    list.push({ itemName: m.itemName, quantity: m.quantity, notes: m.notes || undefined })
    materialsByPooja.set(key, list)
  }

  const dist = [0, 0, 0, 0, 0]
  for (const star of statsAgg[0]?.dist ?? []) {
    if (star >= 1 && star <= 5) dist[star - 1]++
  }

  const profile: PublicPanditProfileDTO = {
    _id: String(pandit._id),
    name: pandit.userId?.name ?? 'Pandit Ji',
    profilePhoto: pandit.profilePhoto ?? '',
    bio: pandit.bio ?? '',
    sampraday: pandit.sampraday ?? '',
    experienceYears: pandit.experienceYears ?? 0,
    languages: pandit.languages ?? [],
    serviceAreas: pandit.serviceAreas ?? [],
    specialization: pandit.specialization ?? [],
    verificationStatus: pandit.verificationStatus,
    ratingAvg: pandit.ratingAvg ?? 0,
    ratingCount: pandit.ratingCount ?? 0,
    completedBookings: pandit.completedBookings ?? 0,
    services: services.map((s) => ({
      _id: String(s._id),
      name: s.name,
      price: s.price,
      durationMin: s.durationMin,
      description: s.description ?? '',
      materials: materialsByPooja.get(String(s._id)) ?? [],
    })),
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      customerName: r.customerId?.name ?? 'Devotee',
      overall: r.overall,
      ritualKnowledge: r.ritualKnowledge,
      punctuality: r.punctuality,
      behaviour: r.behaviour,
      communication: r.communication,
      comment: r.comment ?? '',
      createdAt: r.createdAt.toISOString(),
      panditReply: r.panditReply?.text ? { text: r.panditReply.text, at: r.panditReply.at.toISOString() } : null,
    })),
    reviewStats: {
      dist,
      ritualKnowledge: statsAgg[0]?.rk ?? 0,
      punctuality: statsAgg[0]?.punct ?? 0,
      behaviour: statsAgg[0]?.beh ?? 0,
      communication: statsAgg[0]?.comm ?? 0,
    },
  }

  return <PanditProfileSection pandit={profile} isLoggedIn={!!session?.user} />
}
