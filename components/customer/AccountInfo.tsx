import { User, Mail, Smartphone, Users, Calendar, ShieldCheck, BadgeCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  email: string
  phone: string
  memberSince: string
  status: string
}

// Simple read-only display — plain English labels, no i18n.
export function AccountInfo({ name, email, phone, memberSince, status }: Props) {
  const joinDate = new Date(memberSince).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const rows: Array<{ icon: LucideIcon; label: string; value: string; highlight?: boolean }> = [
    { icon: User, label: 'Full name', value: name },
    { icon: Mail, label: 'Email', value: email },
    { icon: Smartphone, label: 'Phone', value: phone },
    { icon: Users, label: 'Account type', value: 'Devotee' },
    { icon: Calendar, label: 'Member since', value: joinDate },
    {
      icon: ShieldCheck,
      label: 'Account status',
      value: status === 'active' ? 'Active' : status,
      highlight: status === 'active',
    },
  ]

  return (
    <div className="divide-y divide-neutral-100">
      {rows.map(({ icon: Icon, label, value, highlight }) => (
        <div key={label} className="flex items-center gap-3 py-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-neutral-100 bg-neutral-50">
            <Icon className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-neutral-400">{label}</p>
            <p
              className={cn(
                'inline-flex items-center gap-1 truncate text-sm font-medium',
                highlight ? 'text-green-700' : 'text-neutral-900'
              )}
            >
              {value}
              {highlight && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
