"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user
}

export async function getOrCreateConversation(vendorId: string, productId?: string) {
  const user = await requireAuth()

  // Buyers start conversations; vendors can't start one as buyer
  // Normalise: if the caller is a vendor, look up their vendor record
  const buyerId = user.id

  const existing = await prisma.conversation.findFirst({
    where: {
      buyerId,
      vendorId,
      productId: productId ?? null,
    },
    select: { id: true },
  })

  if (existing) return existing.id

  const created = await prisma.conversation.create({
    data: { buyerId, vendorId, productId: productId ?? null },
    select: { id: true },
  })

  return created.id
}

export async function sendMessage(conversationId: string, content: string) {
  const user = await requireAuth()
  const trimmed = content.trim()
  if (!trimmed) throw new Error("Empty message")

  // Verify the caller is a participant
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      vendor: { select: { userId: true } },
    },
  })

  if (!convo) throw new Error("Conversation not found")

  const isParticipant =
    convo.buyerId === user.id || convo.vendor.userId === user.id

  if (!isParticipant) throw new Error("Unauthorized")

  await prisma.message.create({
    data: { conversationId, senderId: user.id, content: trimmed },
  })

  // Touch updatedAt on conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/account/messages/${conversationId}`)
  revalidatePath("/account/messages")
  revalidatePath("/vendor/messages")
}

export async function getConversations() {
  const user = await requireAuth()

  if (user.role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!vendor) return []

    return prisma.conversation.findMany({
      where: { vendorId: vendor.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        product: { select: { name: true, slug: true } },
        buyer: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, isRead: true, senderId: true },
        },
      },
    })
  }

  return prisma.conversation.findMany({
    where: { buyerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      product: { select: { name: true, slug: true } },
      vendor: { select: { name: true, slug: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, isRead: true, senderId: true },
      },
    },
  })
}

export async function getMessages(conversationId: string) {
  const user = await requireAuth()

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      vendor: { select: { userId: true } },
    },
  })

  if (!convo) throw new Error("Conversation not found")

  const isParticipant =
    convo.buyerId === user.id || convo.vendor.userId === user.id

  if (!isParticipant) throw new Error("Unauthorized")

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      isRead: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true, email: true } },
    },
  })
}

export async function markAsRead(conversationId: string) {
  const user = await requireAuth()

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      vendor: { select: { userId: true } },
    },
  })

  if (!convo) return

  const isParticipant =
    convo.buyerId === user.id || convo.vendor.userId === user.id

  if (!isParticipant) return

  // Mark messages sent by the OTHER party as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, isRead: false },
    data: { isRead: true },
  })
}
