import { notFound } from 'next/navigation'
import { getCustomerBookingDetail } from '@/actions/customer-dashboard'
import { CustomerBookingDetailSection } from '@/components/customer/CustomerBookingDetailSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const booking = await getCustomerBookingDetail(id)
  if (!booking) notFound()

  return <CustomerBookingDetailSection booking={booking} />
}
