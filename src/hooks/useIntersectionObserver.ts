"use client"

import { useEffect, useState, useMemo, type RefObject } from "react"

export function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  const stableOptions = useMemo(
    () => options,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.threshold, options.rootMargin]
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
        observer.disconnect()
      }
    }, stableOptions)

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, stableOptions])

  return isIntersecting
}
