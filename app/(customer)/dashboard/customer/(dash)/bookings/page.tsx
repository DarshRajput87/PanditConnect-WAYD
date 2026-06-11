import { getCustomerBookings } from '@/actions/customer-dashboard'
import { CustomerBookingsSection } from '@/components/customer/CustomerBookingsSection'

interface Props {
  searchParams: Promise<{ tab?: string; page?: string }>
}

const STATUS_MAP: Record<string, string | undefined> = {
  all: undefined,
  upcoming: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
}

export default async function BookingsPage({ searchParams }: Props) {
  const { tab: rawTab, page: rawPage } = await searchParams
  const tab = rawTab && rawTab in STATUS_MAP ? rawTab : 'all'
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  const { bookings, pages } = await getCustomerBookings(STATUS_MAP[tab], page)

  return <CustomerBookingsSection tab={tab} page={page} bookings={bookings} pages={pages} />
}
