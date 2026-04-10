"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendMessage } from "@/lib/actions/messages"

type Message = {
  id: string
  content: string
  isRead: boolean
  createdAt: Date
  senderId: string
  sender: { name: string | null; email: string }
}

export default function ChatWindow({
  conversationId,
  messages,
  currentUserId,
}: {
  conversationId: string
  messages: Message[]
  currentUserId: string
}) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText("")

    startTransition(async () => {
      await sendMessage(conversationId, content)
      router.refresh()
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={isPending}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  )
}
