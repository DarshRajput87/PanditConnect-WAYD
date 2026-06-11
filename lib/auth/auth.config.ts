import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@/types'

/**
 * Edge-safe base config shared by the full Node config (lib/auth/config.ts)
 * and the middleware. It intentionally contains NO database or bcrypt imports
 * so it can run in the Edge runtime where Mongoose cannot.
 */
export const authConfig = {
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [], // Credentials provider is added in lib/auth/config.ts (Node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? 'customer'
        session.user.id = (token.id as string) ?? ''
      }
      return session
    },
  },
} satisfies NextAuthConfig
