import { prisma } from "./prisma"

export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
    })

    if (!session) return false
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { token } })
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function getUserFromSessionToken(token: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) return null
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } })
      return null
    }

    return session.user
  } catch {
    return null
  }
}
