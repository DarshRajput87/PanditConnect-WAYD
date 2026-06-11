import { auth } from '@/lib/auth/config'
import { DashboardStub } from '@/components/shared/DashboardStub'

export default async function AdminDashboardPage() {
  const session = await auth()
  return (
    <DashboardStub
      name={session?.user?.name ?? ''}
      titleKey="dashboard.adminTitle"
      cta={{ href: '/dashboard/admin/verification', labelKey: 'admin.verificationQueue' }}
    />
  )
}
