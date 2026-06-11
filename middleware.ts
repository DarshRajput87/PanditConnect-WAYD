import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth/auth.config'

// Edge-safe auth instance (no DB providers) — used only to read the session.
const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify', '/search', '/pandit']
const AUTH_PAGES = ['/login', '/register', '/verify']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const role = req.auth?.user?.role

  // Already signed in? Keep them out of the auth pages — send them to their dashboard.
  if (req.auth && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(`/dashboard/${role ?? 'customer'}`, req.url))
  }

  if (!req.auth && !isPublic) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/dashboard/customer') && role !== 'customer') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/dashboard/pandit') && role !== 'pandit') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
