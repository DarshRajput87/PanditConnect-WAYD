import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { CustomerOnboarding } from '@/components/customer/CustomerOnboarding'

export const metadata = { title: 'Welcome — PanditConnect' }

export default async function CustomerOnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'customer') redirect(`/dashboard/${session.user.role}`)

  // Returning customers who already finished (or skipped) onboarding go straight in.
  await connectDB()
  const user = await User.findById(session.user.id).select('onboardingCompleted').lean()
  if (user?.onboardingCompleted) redirect('/dashboard/customer')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-10">
        <CustomerOnboarding name={session.user.name ?? ''} />
      </main>
      <Footer />
    </div>
  )
}
