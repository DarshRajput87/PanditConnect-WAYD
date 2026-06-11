import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'

export default async function PanditDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login?callbackUrl=/dashboard/pandit')

  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id }).lean()

  // A draft that was never submitted goes to the onboarding wizard first.
  // Submitted profiles (pending, rejected, verified) land on the dashboard —
  // the dashboard shell shows the relevant verification banner.
  if (!pandit || (pandit.verificationStatus !== 'verified' && !pandit.submittedAt)) {
    redirect('/dashboard/pandit/register')
  }

  redirect('/dashboard/pandit/overview')
}
