import { getPanditProfileSummary } from '@/actions/pandit-dashboard'
import { ProfileSection } from '@/components/pandit/ProfileSection'
import { LoadError } from '@/components/pandit/LoadError'

export default async function ProfilePage() {
  const profile = await getPanditProfileSummary()
  if (!profile) return <LoadError />

  return <ProfileSection profile={profile} />
}
