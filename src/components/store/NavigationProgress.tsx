"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const prevUrl = useRef("")

  useEffect(() => {
    const url = pathname + searchParams.toString()
    if (url === prevUrl.current) return
    prevUrl.current = url

    // Finish any running progress
    clearTimeout(timerRef.current)
    setProgress(100)
    setVisible(true)

    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setProgress(0), 200)
    }, 300)
  }, [pathname, searchParams])

  // Start progress on click navigation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return
      if (anchor.getAttribute("target") === "_blank") return
      if (href === pathname) return

      setProgress(20)
      setVisible(true)

      // Simulate progress
      const t1 = setTimeout(() => setProgress(50), 100)
      const t2 = setTimeout(() => setProgress(70), 300)
      const t3 = setTimeout(() => setProgress(85), 600)

      timerRef.current = setTimeout(() => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }, 2000)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [pathname])

  if (!visible && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}
