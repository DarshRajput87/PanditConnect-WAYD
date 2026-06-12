import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { getBookingConfirmation } from '@/actions/customer-dashboard'
import { BookingConfirmedSection } from '@/components/customer/BookingConfirmedSection'

export const metadata = {
  title: 'Booking request sent — PanditConnect',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookingConfirmedPage({ params }: Props) {
  const { id } = await params

  const session = await auth()
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/booking-confirmed/${id}`)}`)
  if (session.user.role !== 'customer') redirect('/')

  const booking = await getBookingConfirmation(id)
  if (!booking) notFound()

  return <BookingConfirmedSection booking={booking} />
}
