'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import {
  Flame,
  LayoutDashboard,
  Inbox,
  BarChart3,
  ListChecks,
  Star,
  User,
  LogOut,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavEntry {
  href: string
  icon: LucideIcon
  labelKey: string
  badge?: boolean
}

const NAV: NavEntry[] = [
  { href: '/dashboard/pandit/overview', icon: LayoutDashboard, labelKey: 'panditDash.nav.overview' },
  { href: '/dashboard/pandit/inquiries', icon: Inbox, labelKey: 'panditDash.nav.inquiries', badge: true },
  { href: '/dashboard/pandit/revenue', icon: BarChart3, labelKey: 'panditDash.nav.revenue' },
  { href: '/dashboard/pandit/services', icon: ListChecks, labelKey: 'panditDash.nav.services' },
  { href: '/dashboard/pandit/reviews', icon: Star, labelKey: 'panditDash.nav.reviews' },
  { href: '/dashboard/pandit/profile', icon: User, labelKey: 'panditDash.nav.profile' },
]

interface Props {
  name: string
  verificationStatus: string
  pendingCount?: number
}

export function Sidebar({ name, verificationStatus, pendingCount = 0 }: Props) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[210px] flex-shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-neutral-900">PanditConnect</span>
        </div>

        {/* Pandit identity */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-neutral-900">{name}</p>
            {verificationStatus === 'verified' ? (
              <span className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                <BadgeCheck className="h-2.5 w-2.5" />
                {t('panditDash.nav.verified')}
              </span>
            ) : (
              <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                {t('panditDash.nav.underReview')}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            {t('panditDash.nav.main')}
          </p>
          {NAV.slice(0, 3).map((item) => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} pendingCount={pendingCount} />
          ))}
          <p className="px-4 pb-1 pt-4 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            {t('panditDash.nav.manage')}
          </p>
          {NAV.slice(3).map((item) => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} pendingCount={pendingCount} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-neutral-200 p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('panditDash.nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-neutral-200 bg-white md:hidden">
        {NAV.slice(0, 5).map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                active ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
              {item.badge && pendingCount > 0 && (
                <span className="absolute right-[calc(50%-16px)] top-0.5 rounded-full bg-orange-500 px-1 text-[9px] font-medium text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}

function NavItem({ item, active, pendingCount }: { item: NavEntry; active: boolean; pendingCount: number }) {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 text-sm transition-colors',
        active
          ? 'bg-orange-50 font-medium text-orange-800 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[3px] before:rounded-r before:bg-orange-500'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      )}
    >
      <Icon className="h-[15px] w-[15px] flex-shrink-0" />
      <span className="flex-1">{t(item.labelKey)}</span>
      {item.badge && pendingCount > 0 && (
        <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {pendingCount}
        </span>
      )}
    </Link>
  )
}
