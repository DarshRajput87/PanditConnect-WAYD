import { notFound, redirect } from 'next/navigation'
import { getBookingForReview } from '@/actions/customer-dashboard'
import { WriteReviewSection } from '@/components/customer/WriteReviewSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WriteReviewPage({ params }: Props) {
  const { id } = await params
  // Returns null when the booking doesn't exist, isn't this customer's, or the
  // 30-day review window has closed.
  const booking = await getBookingForReview(id)
  if (!booking) notFound()

  if (booking.status !== 'completed') redirect(`/dashboard/customer/bookings/${id}`)
  if (booking.hasReview) redirect(`/dashboard/customer/bookings/${id}`)

  return <WriteReviewSection booking={booking} />
}
