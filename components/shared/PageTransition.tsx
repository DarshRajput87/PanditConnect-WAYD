'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Quick opacity fade on every route change. Opacity only — a transform here
// would turn this wrapper into a containing block and break the
// position:fixed mobile tab bars rendered inside it.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'none'
    el.style.opacity = '0'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.2s ease'
      el.style.opacity = '1'
    })
  }, [pathname])

  return <div ref={ref}>{children}</div>
}
