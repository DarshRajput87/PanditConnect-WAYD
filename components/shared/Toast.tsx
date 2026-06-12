'use client'
// Lightweight CSS-only toast system — no library. ToastProvider goes near the
// root (see Providers.tsx); fire toasts from any client component via useToast().
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 4000

const STYLES: Record<ToastType, { box: string; icon: typeof CheckCircle2 }> = {
  success: { box: 'border-green-200 bg-green-50 text-green-800', icon: CheckCircle2 },
  error: { box: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
  info: { box: 'border-blue-200 bg-blue-50 text-blue-800', icon: Info },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Stack — top-right, above everything */}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => {
          const { box, icon: Icon } = STYLES[item.type]
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-md',
                'animate-in slide-in-from-top-2 fade-in',
                box
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="min-w-0 flex-1">{item.message}</p>
              <button onClick={() => dismiss(item.id)} aria-label="Dismiss" className="flex-shrink-0 opacity-50 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  // Fail soft if a component renders outside the provider (e.g. in tests).
  return ctx ?? { toast: () => {} }
}
