import { getPanditRevenueStats, getPanditRevenueTable } from '@/actions/pandit-dashboard'
import { RevenueSection } from '@/components/pandit/RevenueSection'
import { LoadError } from '@/components/pandit/LoadError'

export default async function RevenuePage() {
  const [stats, rows] = await Promise.all([getPanditRevenueStats(), getPanditRevenueTable(20)])

  if ('error' in stats) return <LoadError />

  return <RevenueSection stats={stats} rows={rows} />
}
