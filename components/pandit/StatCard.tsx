import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  alert?: boolean
}

export function StatCard({ label, value, sub, icon: Icon, alert }: Props) {
  return (
    <div className="h-full w-full rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-neutral-500">
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {label}
      </div>
      <div className={cn('text-2xl font-medium leading-tight text-neutral-900', alert && 'text-amber-600')}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-neutral-400">{sub}</div>}
    </div>
  )
}
