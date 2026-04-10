"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { optimizeImageUrl } from "@/lib/imageUtils"

type ProductImage = { id: string; url: string }

export default function ImageGallery({
  images,
  altBase,
}: {
  images: ProductImage[]
  altBase: string
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setActive((prev) => (prev + dir + images.length) % images.length)
    },
    [images.length]
  )

  useEffect(() => {
    if (images.length <= 1 && !lightbox) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(-1)
      else if (e.key === "ArrowRight") goTo(1)
      else if (e.key === "Escape") setLightbox(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goTo, images.length, lightbox])

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [lightbox])

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <span className="text-gray-300 text-6xl">□</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — LEFT of main image (desktop only) */}
        {images.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2 w-16 shrink-0">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  i === active
                    ? "border-blue-500 ring-1 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={optimizeImageUrl(img.url, 80)}
                  alt={`${altBase} ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          className="relative flex-1 aspect-square rounded-2xl bg-gray-100 overflow-hidden group cursor-zoom-in"
          style={{ touchAction: "pan-y" }}
          onClick={() => setLightbox(true)}
        >
          <Image
            src={optimizeImageUrl(images[active].url, 800)}
            alt={altBase}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.15]"
            priority
          />

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(-1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full px-3 py-1">
                {active + 1} / {images.length}
              </div>
            </>
          )}

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium rounded-full px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
            Click to zoom
          </div>
        </div>
      </div>

      {/* Mobile horizontal thumbnails */}
      {images.length > 1 && (
        <div className="flex lg:hidden gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-blue-500 ring-1 ring-blue-500/20"
                  : "border-gray-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={optimizeImageUrl(img.url, 80)}
                alt={`${altBase} ${i + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[85vh] aspect-square mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={optimizeImageUrl(images[active].url, 1200)}
              alt={altBase}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Lightbox arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(-1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Counter */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full px-4 py-1.5">
                {active + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
