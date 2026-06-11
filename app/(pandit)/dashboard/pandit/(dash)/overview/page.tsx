import {
  getPanditOverviewStats,
  getRecentInquiries,
  getPanditReviews,
  getUpcomingBookings,
  getMonthlyBookings,
} from '@/actions/pandit-dashboard'
import { OverviewSection } from '@/components/pandit/OverviewSection'
import { LoadError } from '@/components/pandit/LoadError'

export default async function OverviewPage() {
  const [stats, inquiries, reviews, upcoming, chartData] = await Promise.all([
    getPanditOverviewStats(),
    getRecentInquiries(2),
    getPanditReviews(2),
    getUpcomingBookings(2),
    getMonthlyBookings(),
  ])

  if ('error' in stats) return <LoadError />

  return (
    <OverviewSection stats={stats} inquiries={inquiries} reviews={reviews} upcoming={upcoming} chartData={chartData} />
  )
}
