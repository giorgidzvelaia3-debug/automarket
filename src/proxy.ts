import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  const role = (session?.user as { role?: string } | undefined)?.role

  // Protect admin routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Protect vendor routes — allow both VENDOR and ADMIN
  if (
    pathname.startsWith("/vendor") &&
    role !== "VENDOR" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Protect account routes — require any authenticated user
  if (pathname.startsWith("/account") && !session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Forward pathname as a header so Server Component layouts can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ["/vendor/:path*", "/admin/:path*", "/account/:path*"],
}
