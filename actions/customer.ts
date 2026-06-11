'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { CustomerAddressSchema } from '@/lib/validators/customer'

// Short, translatable error codes — resolved client-side via t(`customerOnboarding.errors.<code>`).
type OnboardingResult = { error: 'unauthorized' | 'invalid' | 'server' } | { success: true }

/**
 * Marks the customer's onboarding as done. Pass an address to save it; pass nothing
 * to "skip for now" (the flag still flips so the step isn't shown again).
 */
export async function completeCustomerOnboarding(address?: unknown): Promise<OnboardingResult> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'customer') return { error: 'unauthorized' }

  const update: Record<string, unknown> = { onboardingCompleted: true }

  if (address !== undefined && address !== null) {
    const parsed = CustomerAddressSchema.safeParse(address)
    if (!parsed.success) return { error: 'invalid' }
    update.address = parsed.data
  }

  try {
    await connectDB()
    await User.updateOne({ _id: session.user.id }, update)
  } catch (err) {
    console.error('completeCustomerOnboarding failed', err)
    return { error: 'server' }
  }

  return { success: true }
}
