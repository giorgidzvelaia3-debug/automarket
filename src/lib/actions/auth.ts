"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function registerUser(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const { name, email, password, confirmPassword } = data

  if (password !== confirmPassword) {
    return { success: false, error: "passwords_mismatch" }
  }

  if (password.length < 8) {
    return { success: false, error: "password_too_short" }
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return { success: false, error: "email_exists" }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "BUYER",
    },
  })

  return { success: true }
}
