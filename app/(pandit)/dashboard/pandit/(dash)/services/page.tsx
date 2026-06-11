import { getPanditServices } from '@/actions/pandit-dashboard'
import { ServicesSection } from '@/components/pandit/ServicesSection'

export default async function ServicesPage() {
  const services = await getPanditServices()
  return <ServicesSection services={services} />
}
