import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { User } from '@/lib/db/models/User'
import { Pooja } from '@/lib/db/models/Pooja'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { VerificationQueue, type PendingPandit } from '@/components/admin/VerificationQueue'
import { VerificationHeader } from '@/components/admin/VerificationHeader'

export const dynamic = 'force-dynamic'

export default async function AdminVerificationPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  await connectDB()
  const pandits = await Pandit.find({ verificationStatus: 'pending' })
    .sort({ submittedAt: 1, createdAt: 1 })
    .limit(50)
    .lean()

  const items: PendingPandit[] = await Promise.all(
    pandits.map(async (p) => {
      const [user, serviceCount] = await Promise.all([
        User.findById(p.userId).lean(),
        Pooja.countDocuments({ panditId: p._id, active: true }),
      ])
      return {
        id: String(p._id),
        name: user?.name ?? '—',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        profilePhoto: p.profilePhoto ?? '',
        idDocumentUrl: p.idDocumentUrl ?? '',
        sampraday: p.sampraday ?? '',
        experienceYears: p.experienceYears ?? 0,
        age: p.age,
        gender: p.gender,
        address: p.address,
        specialization: p.specialization ?? [],
        languages: p.languages ?? [],
        serviceAreas: p.serviceAreas ?? [],
        bio: p.bio ?? '',
        aadhaarLast4: p.aadhaarLast4 ?? '',
        serviceCount,
        submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
      }
    })
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <VerificationHeader count={items.length} />
        <div className="mt-6">
          <VerificationQueue items={items} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
