import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, text, tall }: { icon: LucideIcon; text: React.ReactNode; tall?: boolean }) {
  return (
    <div className={cn('text-center text-sm text-neutral-400', tall ? 'py-16' : 'py-8')}>
      <Icon className={cn('mx-auto mb-2', tall ? 'h-8 w-8' : 'h-6 w-6')} />
      {text}
    </div>
  )
}
