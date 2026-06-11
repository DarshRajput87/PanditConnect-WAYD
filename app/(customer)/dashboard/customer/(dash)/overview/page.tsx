import {
  getCustomerDashboardStats,
  getUpcomingBookings,
  getPendingReviews,
  getSuggestedPandits,
} from '@/actions/customer-dashboard'
import { CustomerOverviewSection } from '@/components/customer/CustomerOverviewSection'
import { LoadError } from '@/components/pandit/LoadError'

export default async function CustomerOverviewPage() {
  const [stats, upcoming, pendingReviews, suggested] = await Promise.all([
    getCustomerDashboardStats(),
    getUpcomingBookings(2),
    getPendingReviews(3),
    getSuggestedPandits(2),
  ])

  if ('error' in stats) return <LoadError />

  return (
    <CustomerOverviewSection stats={stats} upcoming={upcoming} pendingReviews={pendingReviews} suggested={suggested} />
  )
}
