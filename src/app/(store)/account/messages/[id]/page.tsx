import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getMessages, markAsRead } from "@/lib/actions/messages"
import { prisma } from "@/lib/prisma"
import ChatWindow from "./ChatWindow"

export default async function BuyerConversationPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify the conversation belongs to this buyer
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      buyerId: true,
      product: { select: { name: true, slug: true } },
      vendor: { select: { name: true, slug: true } },
    },
  })

  if (!conversation || conversation.buyerId !== session.user.id) notFound()

  await markAsRead(id)
  const messages = await getMessages(id)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/account/messages"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to messages
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span className="text-blue-500 text-base font-bold">
              {conversation.vendor.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{conversation.vendor.name}</p>
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
