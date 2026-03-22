import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuth = !!token
  const pathname = req.nextUrl.pathname

  const protectedRoutes = [
    "/dashboard",
    "/interview",
    "/mock-interview",
    "/resume-builder",
    "/settings",
  ]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !isAuth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If already logged in and trying to access login/signup redirect to dashboard
  if (isAuth && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/mock-interview/:path*",
    "/resume-builder/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
}
