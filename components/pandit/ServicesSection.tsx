'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ListChecks } from 'lucide-react'
import { ServiceRow } from './ServiceRow'
import { ServiceForm } from './ServiceForm'
import { EmptyState } from './EmptyState'
import type { ServiceDTO } from '@/types/dashboard'

export function ServicesSection({ services }: { services: ServiceDTO[] }) {
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const activeCount = services.filter((s) => s.active).length

  return (
    <div className="w-full p-4 pb-24 md:p-6 md:pb-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {t('panditDash.services.summary', { total: services.length, active: activeCount })}
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
          className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('panditDash.services.addService')}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4">
          <ServiceForm inline onClose={() => setShowAdd(false)} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {services.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            tall
            text={
              <>
                {t('panditDash.services.noServices')}{' '}
                <button onClick={() => setShowAdd(true)} className="text-orange-600 hover:underline">
                  {t('panditDash.services.addFirst')}
                </button>
              </>
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {services.map((svc) => (
              <ServiceRow key={svc._id} service={svc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
