'use client'
import { useTranslation } from 'react-i18next'
import type { MonthCountDTO } from '@/types/dashboard'

export function BookingsChart({ data }: { data: MonthCountDTO[] }) {
  const { t } = useTranslation()
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-24 w-full items-end gap-2">
      {data.map((d, i) => {
        const heightPct = Math.round((d.count / max) * 100)
        const isCurrentMonth = i === data.length - 1
        return (
          <div key={`${d.monthIndex}-${i}`} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-500">{d.count > 0 ? d.count : ''}</span>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max(heightPct, 4)}%`,
                maxHeight: '56px',
                minHeight: '3px',
                background: isCurrentMonth ? '#F97316' : '#FED7AA',
              }}
            />
            <span className="text-[10px] text-neutral-400">{t(`panditDash.months.${d.monthIndex}`)}</span>
          </div>
        )
      })}
    </div>
  )
}
