import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return Response.json({ valid: false, message: "Not authenticated" }, { status: 401 })
    }

    const sessionToken = (session.user as any).sessionToken

    if (!sessionToken) {
      return Response.json({ valid: true, user: session.user })
    }

    // Verify token exists in DB
    const dbSession = await prisma.session.findUnique({
      where: { token: sessionToken },
    })

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return Response.json({ valid: false, message: "Session expired" }, { status: 401 })
    }

    return Response.json({
      valid: true,
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        credits: (session.user as any).credits,
        plan: (session.user as any).plan,
      }
    })
  } catch (error: any) {
    return Response.json({ valid: false, message: error.message }, { status: 500 })
  }
}
