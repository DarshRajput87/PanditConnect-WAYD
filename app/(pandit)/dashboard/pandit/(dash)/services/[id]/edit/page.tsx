import { notFound } from 'next/navigation'
import { getPanditService } from '@/actions/pandit-dashboard'
import { ServiceForm } from '@/components/pandit/ServiceForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params
  const service = await getPanditService(id)
  if (!service) notFound()

  return <ServiceForm service={service} />
}
