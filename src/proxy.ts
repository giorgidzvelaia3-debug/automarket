import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Auth-protected routes ──
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/account")
  ) {
    const session = await auth()
    const role = (session?.user as { role?: string } | undefined)?.role

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (pathname.startsWith("/vendor") && role !== "VENDOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (pathname.startsWith("/account") && !session?.user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", pathname)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set("Cache-Control", "no-store, must-revalidate")
    return response
  }

  // ── Public routes — set cache headers ──
  const response = NextResponse.next()

  if (pathname.startsWith("/products/")) {
    response.headers.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600")
  } else if (
    pathname === "/" ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/vendors") ||
    pathname.startsWith("/search")
  ) {
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
}
