"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLocale } from "next-intl"
import { localized } from "@/lib/localeName"

type Banner = {
  id: string
  title: string
  titleEn: string | null
  subtitle: string | null
  subtitleEn: string | null
  imageUrl: string
  linkUrl: string | null
}

export default function HeroBannerCarousel({ banners }: { banners: Banner[] }) {
  const locale = useLocale()
  const [active, setActive] = useState(0)
  const count = banners.length

  const goTo = useCallback((i: number) => {
    setActive(((i % count) + count) % count)
  }, [count])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => goTo(active + 1), 5000)
    return () => clearInterval(timer)
  }, [active, count, goTo])

  if (count === 0) return null

  const banner = banners[active]
  const Wrapper = banner.linkUrl ? Link : "div"
  const wrapperProps = banner.linkUrl ? { href: banner.linkUrl } : {}

  return (
    <div className="relative w-full aspect-[16/6] sm:aspect-[16/5] rounded-2xl overflow-hidden bg-gray-200 group">
      {/* @ts-expect-error conditional wrapper */}
      <Wrapper {...wrapperProps} className="block relative w-full h-full">
        <Image
          key={banner.id}
          src={banner.imageUrl}
          alt={localized(locale, banner.title, banner.titleEn)}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-opacity duration-500"
          priority={active === 0}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg leading-tight">
            {localized(locale, banner.title, banner.titleEn)}
          </h2>
          {(banner.subtitle || banner.subtitleEn) && (
            <p className="mt-1.5 text-sm sm:text-base text-white/80 drop-shadow max-w-lg">
              {localized(locale, banner.subtitle, banner.subtitleEn)}
            </p>
          )}
        </div>
      </Wrapper>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => goTo(active + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === active ? "bg-white w-5" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
