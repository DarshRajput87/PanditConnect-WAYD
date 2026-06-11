import { redirect } from 'next/navigation'
import { getMyPanditProfile } from '@/actions/pandit'
import { RegistrationWizard } from '@/components/pandit/RegistrationWizard'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'

export default async function PanditOnboardingPage() {
  const data = await getMyPanditProfile()
  if (!data) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-neutral-50 px-4 py-8">
        <RegistrationWizard data={data} />
      </main>
      <Footer />
    </div>
  )
}
