import { redirect } from 'next/navigation'
import { VerifyForm } from '@/components/auth/VerifyForm'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  // No email to verify against — start the flow from registration.
  if (!email) redirect('/register')

  return <VerifyForm email={email} />
}
