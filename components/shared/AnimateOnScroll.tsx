'use client'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Animation = 'fade-up' | 'fade-in' | 'slide-in'

// Full class names (not template strings) so the Tailwind scanner picks them up.
const ANIMATION_CLASS: Record<Animation, string> = {
  'fade-up': 'animate-fade-up',
  'fade-in': 'animate-fade-in',
  'slide-in': 'animate-slide-in',
}

interface Props {
  children: React.ReactNode
  className?: string
  animation?: Animation
  delay?: number
}

// Plays a one-shot entrance animation when the element scrolls into view.
export function AnimateOnScroll({ children, className, animation = 'fade-up', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('opacity-0', visible && ANIMATION_CLASS[animation], className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  )
}
