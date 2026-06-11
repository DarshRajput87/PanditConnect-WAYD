import Link from 'next/link'
import { Flame } from 'lucide-react'
import { AuthAside } from '@/components/auth/AuthAside'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthAside />
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="px-6 py-5 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-neutral-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500">
              <Flame className="h-4 w-4 text-white" />
            </span>
            PanditConnect
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-2 lg:pt-12">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </div>
  )
}
