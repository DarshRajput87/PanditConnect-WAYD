import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Review } from '@/lib/db/models/Review'
import { PanditProfileSection } from '@/components/customer/PanditProfileSection'
import type { PublicPanditProfileDTO } from '@/types/dashboard'

export const metadata = {
  title: 'Pandit profile — PanditConnect',
}

interface Props {
  params: Promise<{ id: string }>
}

// Public pandit profile — anyone can view; booking is gated at the CTA.
export default async function PublicPanditPage({ params }: Props) {
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) notFound()

  await connectDB()
  const pandit = await Pandit.findOne({ _id: id, verificationStatus: 'verified' })
    .populate<{ userId: { name?: string } }>('userId', 'name')
    .lean()
  if (!pandit) notFound()

  const [services, reviews, session] = await Promise.all([
    Pooja.find({ panditId: pandit._id, active: true }).sort({ price: 1 }).lean(),
    Review.find({ panditId: pandit._id, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate<{ customerId: { name?: string } }>('customerId', 'name')
      .lean(),
    auth(),
  ])

  const profile: PublicPanditProfileDTO = {
    _id: String(pandit._id),
    name: pandit.userId?.name ?? 'Pandit Ji',
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
    })),
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      customerName: r.customerId?.name ?? 'Devotee',
      overall: r.overall,
      comment: r.comment ?? '',
      createdAt: r.createdAt.toISOString(),
    })),
  }

  return <PanditProfileSection pandit={profile} isLoggedIn={!!session?.user} />
}
