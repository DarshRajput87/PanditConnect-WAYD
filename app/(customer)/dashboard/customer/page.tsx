import { redirect } from 'next/navigation'

// The customer dashboard home lives at /overview (inside the (dash) shell).
// Onboarding (/dashboard/customer/onboarding) stays outside the shell and is
// pushed directly after login/registration when relevant.
export default function CustomerDashboardPage() {
  redirect('/dashboard/customer/overview')
}
