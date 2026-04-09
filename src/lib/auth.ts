import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  // NOTE: PrismaAdapter is cast to any because our client is generated to a
  // custom path (src/generated/prisma) rather than the default .prisma/client.
  // At runtime the client is fully compatible; only the TypeScript type differs.
  // Full adapter functionality (OAuth, magic links) also requires Account,
  // Session, and VerificationToken models to be added to the Prisma schema.
  adapter: PrismaAdapter(prisma as any) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // user.role comes from the authorize() return value above
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as any
      }
      return session
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const role = session?.user?.role
      const path = nextUrl.pathname

      if (path.startsWith("/admin")) {
        return role === "ADMIN"
      }
      if (path.startsWith("/vendor")) {
        return role === "VENDOR" || role === "ADMIN"
      }
      return true
    },
  },
})
