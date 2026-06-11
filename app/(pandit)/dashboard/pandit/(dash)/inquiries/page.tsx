import { getPanditInquiries } from '@/actions/pandit-dashboard'
import { InquiriesSection } from '@/components/pandit/InquiriesSection'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function InquiriesPage({ searchParams }: Props) {
  const { tab: rawTab } = await searchParams
  const tab = rawTab === 'confirmed' || rawTab === 'completed' ? rawTab : 'new'

  const [newBookings, confirmed, completed] = await Promise.all([
    getPanditInquiries('requested'),
    getPanditInquiries('confirmed'),
    getPanditInquiries('completed', 20),
  ])

  return <InquiriesSection tab={tab} newBookings={newBookings} confirmed={confirmed} completed={completed} />
}
