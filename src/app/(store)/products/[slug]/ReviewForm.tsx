"use client"

import { useState, useTransition } from "react"
import { StarPicker } from "@/components/store/StarRating"
import { createReview } from "@/lib/actions/reviews"

export default function ReviewForm({
  productId,
  existing,
}: {
  productId: string
  existing?: { rating: number; comment: string | null }
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? "")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return

    startTransition(async () => {
      try {
        await createReview(productId, rating, comment)
        setStatus("success")
        setTimeout(() => setStatus("idle"), 3000)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Your rating</p>
        <StarPicker value={rating} onChange={setRating} />
        {rating === 0 && (
          <p className="mt-1 text-xs text-gray-400">Click a star to rate</p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1.5">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          status === "success"
            ? "bg-green-600 text-white focus:ring-green-500"
            : status === "error"
              ? "bg-red-600 text-white focus:ring-red-500"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
        }`}
      >
        {isPending
          ? "Saving…"
          : status === "success"
            ? "✓ Saved"
            : status === "error"
              ? "Error — try again"
              : existing
                ? "Update Review"
                : "Submit Review"}
      </button>
    </form>
  )
}
