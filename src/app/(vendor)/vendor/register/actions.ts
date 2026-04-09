"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function createVendorProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    throw new Error("Unauthorized")
  }

  const name = (formData.get("name") as string).trim()
  const slug = (formData.get("slug") as string).trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const phone = (formData.get("phone") as string | null)?.trim() || null

  const existing = await prisma.vendor.findFirst({
    where: { OR: [{ slug }, { userId: session.user.id }] },
  })

  if (existing?.userId === session.user.id) {
    redirect("/vendor/dashboard")
  }

  if (existing) {
    redirect(
      `/vendor/register?error=Slug+%22${encodeURIComponent(slug)}%22+is+already+taken`
    )
  }

  await prisma.vendor.create({
    data: {
      userId: session.user.id,
      name,
      slug,
      description,
      phone,
      status: "PENDING",
    },
  })

  revalidatePath("/vendor")
  redirect("/vendor/dashboard")
}
