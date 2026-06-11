import { getCustomerReviews } from '@/actions/customer-dashboard'
import { CustomerReviewsSection } from '@/components/customer/CustomerReviewsSection'

export default async function CustomerReviewsPage() {
  const reviews = await getCustomerReviews()
  return <CustomerReviewsSection reviews={reviews} />
}
