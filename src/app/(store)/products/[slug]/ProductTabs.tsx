"use client"

import { useState } from "react"
import Link from "next/link"
import { StarDisplay } from "@/components/store/StarRating"
import ReviewForm from "./ReviewForm"

type Review = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  userId: string
  userName: string
}

export default function ProductTabs({
  description,
  descriptionEn,
  reviews,
  starCounts,
  avgRating,
  totalReviewCount,
  productId,
  currentUserId,
  existingReview,
}: {
  description: string | null
  descriptionEn: string | null
  reviews: Review[]
  totalReviewCount: number
  starCounts: number[]
  avgRating: number
  productId: string
  currentUserId: string | null
  existingReview?: { rating: number; comment: string | null }
}) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description")
  const reviewCount = totalReviewCount

  return (
    <div id="reviews" className="scroll-mt-24">
      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`px-5 py-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === "description"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-5 py-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === "reviews"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Reviews
            {reviewCount > 0 && (
              <span className={`ml-1.5 text-xs font-normal ${
                activeTab === "reviews" ? "text-blue-400" : "text-gray-400"
              }`}>
                ({reviewCount})
              </span>
            )}
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* ─── Description Tab ──────────────────────────────────── */}
        {activeTab === "description" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {descriptionEn || description ? (
              <div className="space-y-4">
                {descriptionEn && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">English</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{descriptionEn}</p>
                  </div>
                )}
                {description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ქართული</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No description available.</p>
            )}
          </div>
        )}

        {/* ─── Reviews Tab ──────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Summary + review list */}
            <div className="lg:col-span-3 space-y-6">
              {/* Rating summary */}
              {reviewCount > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    <div className="mt-1">
                      <StarDisplay rating={avgRating} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = starCounts[star - 1]
                      const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-2.5 text-xs">
                          <span className="w-3 text-gray-500 text-right font-medium">{star}</span>
                          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-7 text-gray-400 text-right tabular-nums">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Review cards */}
              {reviewCount === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl mb-3">★</p>
                  <p className="text-sm font-medium text-gray-900 mb-1">No reviews yet</p>
                  <p className="text-xs text-gray-400">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const initial = review.userName.charAt(0).toUpperCase()
                    return (
                      <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0">
                            <span className="text-blue-600 text-sm font-bold">{initial}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {review.userName}
                                  {review.userId === currentUserId && (
                                    <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">{review.createdAt}</p>
                              </div>
                              <StarDisplay rating={review.rating} size="sm" />
                            </div>
                            {review.comment && (
                              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Review form */}
            <div className="lg:col-span-2">
              {currentUserId ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-24">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {existingReview ? "Edit your review" : "Write a review"}
                  </h3>
                  <ReviewForm
                    productId={productId}
                    existing={existingReview}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">Sign in to leave a review</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
