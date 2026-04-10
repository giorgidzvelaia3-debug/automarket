"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export default function StickyPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const navHeight = 80 // navbar height approx
    const gap = 16

    function onScroll() {
      if (!el) return
      const parent = el.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const elHeight = el.scrollHeight
      const viewportHeight = window.innerHeight

      // How far can panel travel within parent
      const maxTravel = parentRect.height - elHeight
      if (maxTravel <= 0) {
        setOffset(0)
        return
      }

      // How far has parent scrolled past top
      const scrolled = -(parentRect.top - navHeight - gap)

      if (scrolled <= 0) {
        setOffset(0)
      } else if (scrolled >= maxTravel) {
        setOffset(maxTravel)
      } else {
        setOffset(scrolled)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div ref={ref} className="hidden lg:block" style={{ transform: `translateY(${offset}px)`, transition: "transform 0.1s ease-out" }}>
      {children}
    </div>
  )
}
