import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { Sidebar } from '@/components/pandit/Sidebar'
import { Topbar } from '@/components/pandit/Topbar'
import { VerificationBanner } from '@/components/pandit/VerificationBanner'

export default async function PanditDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login?callbackUrl=/dashboard/pandit/overview')
  if (session.user.role !== 'pandit') redirect('/')

  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id })
    .populate<{ userId: { name?: string; email?: string } }>('userId', 'name email')
    .lean()

  // No profile, or a draft that was never submitted → finish onboarding first.
  if (!pandit) redirect('/dashboard/pandit/register')
  if (pandit.verificationStatus !== 'verified' && !pandit.submittedAt) {
    redirect('/dashboard/pandit/register')
  }

  const pendingCount = await Booking.countDocuments({
    panditId: pandit._id,
    status: 'requested',
    expiresAt: { $gt: new Date() },
  })

  const name = pandit.userId?.name ?? session.user.name ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar name={name} verificationStatus={pandit.verificationStatus} pendingCount={pendingCount} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar name={name} />
        <VerificationBanner status={pandit.verificationStatus} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
