import { notFound } from 'next/navigation'
import { getBookingDetail } from '@/actions/pandit-dashboard'
import { BookingDetail } from '@/components/pandit/BookingDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const booking = await getBookingDetail(id)
  if (!booking) notFound()

  return <BookingDetail booking={booking} />
}
