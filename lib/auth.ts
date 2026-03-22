import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

let bcrypt: any
let prisma: any

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          if (!prisma) prisma = (await import("@/lib/prisma")).prisma
          if (!bcrypt) bcrypt = require("bcryptjs")
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })
          if (!user || !user.password) return null
          const isValid = await bcrypt.compare(credentials.password as string, user.password)
          if (!isValid) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            credits: user.credits,
            plan: user.plan,
          }
        } catch (err: any) {
          console.error("Auth error:", err.message)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.credits = (user as any).credits ?? 30
        token.plan = (user as any).plan ?? "free"
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).credits = token.credits
        (session.user as any).plan = token.plan as string
      }
      return session
    },
  },
}
