"use client"

import { useRef, useState, useEffect } from "react"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: "300px",
  threshold: 0,
}

export default function LazySection({
  children,
  minHeight = 200,
  animate = true,
}: {
  children: React.ReactNode
  minHeight?: number
  animate?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, OBSERVER_OPTIONS)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (isVisible && !entered) {
      requestAnimationFrame(() => setEntered(true))
    }
  }, [isVisible, entered])

  return (
    <div ref={ref} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? (
        <div
          className={animate ? "transition-all duration-500 ease-out" : undefined}
          style={animate ? {
            opacity: entered ? 1 : 0,
            transform: entered ? "none" : "translateY(20px)",
          } : undefined}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
