import Link from "next/link"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { getTranslations } from "next-intl/server"
import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; registered?: string }>
}) {
  const [{ error, registered }, t] = await Promise.all([
    props.searchParams,
    getTranslations("Auth"),
  ])

  async function login(formData: FormData) {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    })

    const redirectTo =
      user?.role === "ADMIN"
        ? "/admin"
        : user?.role === "VENDOR"
          ? "/vendor"
          : "/"

    try {
      await signIn("credentials", { email, password, redirectTo })
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=Invalid+email+or+password")
      }
      throw err
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t("appName")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("signInTitle")}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {registered && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm text-green-700">{t("successRegistered")}</p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
          </div>
        )}

        <form action={login} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            {t("submitSignIn")}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  )
}
