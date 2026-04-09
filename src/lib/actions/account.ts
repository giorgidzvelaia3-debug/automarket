"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function updateBuyerProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = (formData.get("name") as string).trim()
  const currentPassword = (formData.get("currentPassword") as string | null)?.trim() || null
  const newPassword = (formData.get("newPassword") as string | null)?.trim() || null
  const confirmPassword = (formData.get("confirmPassword") as string | null)?.trim() || null

  if (!name) throw new Error("Name is required")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  // Password change
  if (newPassword) {
    if (!currentPassword) throw new Error("Enter your current password")
    if (newPassword.length < 8) throw new Error("New password must be at least 8 characters")
    if (newPassword !== confirmPassword) throw new Error("Passwords do not match")
    if (!user?.password) throw new Error("Cannot change password")

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) throw new Error("Current password is incorrect")

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, password: hashed },
    })
  } else {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })
  }

  revalidatePath("/account/profile")
}
