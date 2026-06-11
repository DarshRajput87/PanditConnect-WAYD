'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { togglePoojaActive } from '@/actions/pandit-services'
import { formatINR, formatDuration } from './format'
import { cn } from '@/lib/utils'
import type { ServiceDTO } from '@/types/dashboard'

export function ServiceRow({ service }: { service: ServiceDTO }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [active, setActive] = useState(service.active)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !active
    setActive(next) // optimistic
    startTransition(async () => {
      const result = await togglePoojaActive(service._id, next)
      if ('error' in result) setActive(!next) // revert on error
      else router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', active ? 'text-neutral-900' : 'text-neutral-400')}>{service.name}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {formatINR(service.price)} · {formatDuration(service.durationMin)}
        </p>
      </div>
      {/* Toggle */}
      <button
        onClick={toggle}
        disabled={isPending}
        role="switch"
        aria-checked={active}
        aria-label={t(active ? 'panditDash.services.deactivateAria' : 'panditDash.services.activateAria', {
          name: service.name,
        })}
        className={cn(
          'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-50',
          active ? 'bg-orange-500' : 'bg-neutral-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all',
            active ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </button>
      {/* Edit */}
      <Link
        href={`/dashboard/pandit/services/${service._id}/edit`}
        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        aria-label={t('panditDash.services.editAria', { name: service.name })}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
