import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Booking } from '@/lib/db/models/Booking'
import { CustomerSidebar } from '@/components/customer/CustomerSidebar'
import { CustomerTopbar } from '@/components/customer/CustomerTopbar'

export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login?callbackUrl=/dashboard/customer/overview')
  if (session.user.role !== 'customer') redirect('/')

  await connectDB()
  const user = await User.findById(session.user.id).select('name').lean()
  if (!user) redirect('/login')

  const upcomingCount = await Booking.countDocuments({
    customerId: session.user.id,
    status: 'confirmed',
    scheduledAt: { $gte: new Date() },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <CustomerSidebar name={user.name} upcomingCount={upcomingCount} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CustomerTopbar name={user.name} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
