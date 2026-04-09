import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getConversations } from "@/lib/actions/messages"

export default async function VendorMessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const conversations = await getConversations() as Array<{
    id: string
    updatedAt: Date
    product: { name: string; slug: string } | null
    buyer: { name: string | null; email: string }
    messages: { content: string; createdAt: Date; isRead: boolean; senderId: string }[]
  }>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm">No conversations yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {conversations.map((conv) => {
            const last = conv.messages[0]
            const hasUnread = last && !last.isRead && last.senderId !== session.user.id
            const buyerName = conv.buyer?.name ?? conv.buyer?.email.split("@")[0]
            return (
              <Link
                key={conv.id}
                href={`/vendor/messages/${conv.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-gray-500 text-base font-bold">
                    {buyerName.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                      {buyerName}
                    </p>
                    {last && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {last.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                  {conv.product && (
                    <p className="text-xs text-blue-500 truncate">{conv.product.name}</p>
                  )}
                  {last && (
                    <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                      {last.content}
                    </p>
                  )}
                </div>

                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
