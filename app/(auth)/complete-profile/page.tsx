import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { CompleteProfileForm } from '@/components/auth/CompleteProfileForm'

// Landing step after a Google sign-in. New users finish here (role + mobile);
// returning users with a complete account are sent straight to their dashboard.
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  await connectDB()
  const existing = await User.findOne({ email: session.user.email }).lean()
  if (existing?.phone) redirect(`/dashboard/${existing.role}`)

  const { role } = await searchParams
  const presetRole = role === 'pandit' || role === 'customer' ? role : undefined

  return (
    <CompleteProfileForm
      email={session.user.email}
      name={session.user.name ?? ''}
      presetRole={presetRole}
    />
  )
}
