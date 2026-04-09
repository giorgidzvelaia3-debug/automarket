import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getConversations } from "@/lib/actions/messages"

export default async function BuyerMessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const conversations = await getConversations() as Array<{
    id: string
    updatedAt: Date
    product: { name: string; slug: string } | null
    vendor: { name: string; slug: string }
    messages: { content: string; createdAt: Date; isRead: boolean; senderId: string }[]
  }>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm mb-4">No conversations yet.</p>
          <Link
            href="/vendors"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Vendors
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {conversations.map((conv) => {
            const last = conv.messages[0]
            const hasUnread = last && !last.isRead && last.senderId !== session.user.id
            return (
              <Link
                key={conv.id}
                href={`/account/messages/${conv.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-500 text-base font-bold">
                    {conv.vendor.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                      {conv.vendor.name}
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
