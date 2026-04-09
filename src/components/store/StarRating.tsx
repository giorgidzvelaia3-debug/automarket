"use client"

import { useState } from "react"

function Star({
  filled,
  half,
  size = "md",
}: {
  filled: boolean
  half?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5"

  return (
    <svg className={`${sz} ${filled || half ? "text-amber-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
      {half ? (
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        fill={half ? "url(#half)" : "currentColor"}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

/** Display-only rating (supports half stars) */
export function StarDisplay({
  rating,
  count,
  size = "md",
}: {
  rating: number
  count?: number
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} filled={i < Math.floor(rating)} half={i === Math.floor(rating) && rating % 1 >= 0.5} size={size} />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  )
}

/** Interactive star picker */
export function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none"
            aria-label={`${star} star`}
          >
            <Star filled={star <= display} size="lg" />
          </button>
        )
      })}
    </div>
  )
}
