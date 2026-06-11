import { getCustomerSettings } from '@/actions/customer-dashboard'
import { SettingsSection } from '@/components/customer/SettingsSection'
import { LoadError } from '@/components/pandit/LoadError'

export default async function SettingsPage() {
  const settings = await getCustomerSettings()
  if (!settings) return <LoadError />

  return <SettingsSection settings={settings} />
}
