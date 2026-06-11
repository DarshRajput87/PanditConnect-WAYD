import { getPanditReviewStats, getPanditReviews } from '@/actions/pandit-dashboard'
import { ReviewsSection } from '@/components/pandit/ReviewsSection'

export default async function ReviewsPage() {
  const [stats, reviews] = await Promise.all([getPanditReviewStats(), getPanditReviews(20)])
  return <ReviewsSection stats={stats} reviews={reviews} />
}
