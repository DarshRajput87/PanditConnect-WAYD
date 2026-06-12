import { notFound, redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { User } from '@/lib/db/models/User'
import { isRazorpayConfigured } from '@/lib/payments/razorpay'
import { DATE_RE } from '@/lib/booking/slots'
import { BookingWizard } from './_components/BookingWizard'
import type { BookPanditDTO, BookPoojaDTO } from '@/types/dashboard'

export const metadata = {
  title: 'Book a Pandit Ji — PanditConnect',
}

interface Props {
  params: Promise<{ panditId: string }>
  searchParams: Promise<{ poojaId?: string; date?: string; time?: string }>
}

export default async function BookPage({ params, searchParams }: Props) {
  const { panditId } = await params
  const sp = await searchParams

  const session = await auth()
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/book/${panditId}`)}`)
  if (session.user.role !== 'customer') redirect(`/pandit/${panditId}`)

  if (!mongoose.isValidObjectId(panditId)) notFound()
  await connectDB()

  const [pandit, poojas, customer] = await Promise.all([
    Pandit.findById(panditId)
      .select('userId profilePhoto sampraday experienceYears ratingAvg ratingCount verificationStatus serviceAreas')
      .populate<{ userId: { name?: string } }>('userId', 'name')
      .lean(),
    Pooja.find({ panditId, active: true })
      .sort({ price: 1 })
      .select('name price durationMin catalogKey')
      .lean(),
    User.findById(session.user.id).select('name email address').lean(),
  ])

  if (!pandit || pandit.verificationStatus !== 'verified') notFound()

  const panditDto: BookPanditDTO = {
    _id: String(pandit._id),
    name: pandit.userId?.name ?? 'Pandit Ji',
    profilePhoto: pandit.profilePhoto ?? '',
    sampraday: pandit.sampraday ?? '',
    experienceYears: pandit.experienceYears ?? 0,
    ratingAvg: pandit.ratingAvg ?? 0,
    ratingCount: pandit.ratingCount ?? 0,
    serviceAreas: pandit.serviceAreas ?? [],
  }

  const poojaDtos: BookPoojaDTO[] = poojas.map((p) => ({
    _id: String(p._id),
    name: p.name,
    price: p.price,
    durationMin: p.durationMin,
    catalogKey: p.catalogKey,
  }))

  // Deep-link params (?poojaId / ?date / ?time, e.g. from the alternatives flow).
  const initialPoojaId = poojaDtos.some((p) => p._id === sp.poojaId) ? sp.poojaId! : ''
  const initialDate = sp.date && DATE_RE.test(sp.date) ? sp.date : ''
  const initialTime = sp.time && /^\d{2}:00$/.test(sp.time) ? sp.time : ''

  const savedAddress =
    customer?.address?.line1 && customer.address.city
      ? {
          line1: customer.address.line1 ?? '',
          city: customer.address.city ?? '',
          state: customer.address.state ?? '',
          pincode: customer.address.pincode ?? '',
        }
      : null

  return (
    <BookingWizard
      pandit={panditDto}
      poojas={poojaDtos}
      savedAddress={savedAddress}
      initialPoojaId={initialPoojaId}
      initialDate={initialDate}
      initialTime={initialTime}
      customerName={customer?.name ?? ''}
      customerEmail={customer?.email ?? ''}
      razorpayEnabled={isRazorpayConfigured}
    />
  )
}
