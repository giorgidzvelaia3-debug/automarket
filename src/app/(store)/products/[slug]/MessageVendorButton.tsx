"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { getOrCreateConversation } from "@/lib/actions/messages"

export default function MessageVendorButton({
  vendorId,
  productId,
  isLoggedIn,
}: {
  vendorId: string
  productId: string
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    startTransition(async () => {
      const conversationId = await getOrCreateConversation(vendorId, productId)
      router.push(`/account/messages/${conversationId}`)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {isPending ? "..." : "Message"}
    </button>
  )
}
