"use client"

import { useState, useEffect } from "react"

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00"
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, "0")

  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}`
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export default function CountdownTimer({
  endTime,
  size = "md",
}: {
  endTime: string | Date
  size?: "sm" | "md"
}) {
  const [remaining, setRemaining] = useState(() => new Date(endTime).getTime() - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(endTime).getTime() - Date.now()
      setRemaining(ms)
      if (ms <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  const ended = remaining <= 0
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  return (
    <span className={`font-mono font-semibold tabular-nums ${textSize} ${ended ? "text-gray-400" : "text-red-600"}`}>
      {ended ? "Ended" : formatTime(remaining)}
    </span>
  )
}
