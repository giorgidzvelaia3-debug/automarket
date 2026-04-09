import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getMessages, markAsRead } from "@/lib/actions/messages"
import { prisma } from "@/lib/prisma"
import ChatWindow from "./ChatWindow"

export default async function VendorConversationPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify the conversation belongs to this vendor
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      product: { select: { name: true, slug: true } },
      vendor: { select: { userId: true, name: true } },
      buyer: { select: { name: true, email: true } },
    },
  })

  if (!conversation || conversation.vendor.userId !== session.user.id) notFound()

  await markAsRead(id)
  const messages = await getMessages(id)

  const buyerName = conversation.buyer?.name ?? conversation.buyer?.email.split("@")[0]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/vendor/messages"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to messages
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-gray-500 text-base font-bold">
              {buyerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{buyerName}</p>
            {conversation.product && (
              <p className="text-xs text-blue-500">{conversation.product.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <ChatWindow
          conversationId={id}
          messages={messages}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}
