import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import crypto from "crypto"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
        async authorize(credentials) {
          try {
            if (!credentials?.email || !credentials?.password) return null

            const user = await prisma.user.findUnique({
              where: { email: credentials.email as string },
            })

            if (!user || !user.password) return null

            const bcrypt = require("bcryptjs")
            const isValid = await bcrypt.compare(credentials.password as string, user.password)
            if (!isValid) return null

            // Try to save session token but do not block login if it fails
            let sessionToken = null
            try {
              const crypto = require("crypto")
              const token = crypto.randomBytes(32).toString("hex")
              const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              await prisma.session.create({
                data: { userId: user.id, token, expiresAt },
              })
              sessionToken = token
            } catch (sessionError: any) {
              console.error("Session save failed (non-blocking):", sessionError.message)
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name || "",
              credits: user.credits,
              plan: user.plan,
              sessionToken,
            }
          } catch (err: any) {
            console.error("Auth error:", err.message)
            return null
          }
        }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google sign-in: create user with 30 credits if first time
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email } })
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                image: user.image || null,
                credits: 30,
                plan: "free",
              },
            })
          }
        } catch (e) {
          console.error("Google signIn user creation error:", e)
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.credits = (user as any).credits ?? 30
        token.plan = (user as any).plan ?? "free"
        token.sessionToken = (user as any).sessionToken
      }
      // For Google provider, look up the user in DB to get id/credits
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } })
          if (dbUser) {
            token.id = dbUser.id
            token.credits = dbUser.credits
            token.plan = dbUser.plan
          }
        } catch (e) {
          console.error("JWT Google lookup error:", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).credits = token.credits as number
        ;(session.user as any).plan = token.plan as string
        ;(session.user as any).sessionToken = token.sessionToken as string
      }
      return session
    },
  },
  events: {
    async signOut({ token }) {
      // Delete session from DB on logout
      if (token?.sessionToken) {
        try {
          await prisma.session.deleteMany({
            where: { token: token.sessionToken as string },
          })
        } catch (e) {
          console.error("Session cleanup error:", e)
        }
      }
    },
  },
}
