import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import type { Role } from '@/types'

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (credentials) => {
      const parsed = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials)
      if (!parsed.success) return null

      await connectDB()
      // Suspended/deleted accounts are excluded → login rejected.
      const user = await User.findOne({
        email: parsed.data.email,
        status: { $in: ['active', 'pending'] },
      }).lean()
      if (!user || !user.passwordHash) return null

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
      if (!valid) return null

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }
    },
  }),
]

// Google is optional: only registered when credentials are configured, so the app
// runs fine in dev without them (the "Continue with Google" button stays hidden via
// NEXT_PUBLIC_GOOGLE_ENABLED).
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Same email address = same PanditConnect user (we match by email below).
      allowDangerousEmailAccountLinking: true,
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Credentials sign-in: role/id come straight from authorize().
      if (user) {
        if (user.id) token.id = user.id
        const role = (user as { role?: Role }).role
        if (role) token.role = role
      }
      // OAuth (Google) sign-ins arrive without an app role. Resolve our User by email
      // so role + canonical id come from the DB — and re-sync on an explicit session
      // update (fired right after a new Google user finishes /complete-profile).
      if (token.email && (!token.role || !token.id || trigger === 'update')) {
        await connectDB()
        const dbUser = await User.findOne({ email: token.email }).lean()
        if (dbUser) {
          token.id = dbUser._id.toString()
          token.role = dbUser.role
        }
      }
      return token
    },
  },
})
