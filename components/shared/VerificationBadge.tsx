import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/types'

interface Props {
  status: VerificationStatus
  size?: 'sm' | 'md'
}

export function VerificationBadge({ status, size = 'md' }: Props) {
  if (status !== 'verified') return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-green-50 font-medium text-green-700',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      <BadgeCheck className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      Verified
    </span>
  )
}
