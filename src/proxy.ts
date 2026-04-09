import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  const role = (session?.user as { role?: string } | undefined)?.role

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (
    pathname.startsWith("/vendor") &&
    role !== "VENDOR" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Forward pathname as a header so Server Component layouts can read it
  // without needing the Edge-only usePathname hook.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ["/vendor/:path*", "/admin/:path*"],
}
