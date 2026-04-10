"use client"

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

export default function SideBanner({ banner }: { banner: Banner }) {
  const locale = useLocale()
  const Wrapper = banner.linkUrl ? Link : "div"
  const wrapperProps = banner.linkUrl ? { href: banner.linkUrl } : {}

  return (
    // @ts-expect-error conditional wrapper
    <Wrapper {...wrapperProps} className="relative block w-full flex-1 min-h-[140px] rounded-2xl overflow-hidden bg-gray-200 group">
      <Image
        src={banner.imageUrl}
        alt={localized(locale, banner.title, banner.titleEn)}
        fill
        sizes="(max-width: 768px) 100vw, 25vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-bold text-white drop-shadow-lg leading-snug">
          {localized(locale, banner.title, banner.titleEn)}
        </p>
        {(banner.subtitle || banner.subtitleEn) && (
          <p className="text-xs text-white/70 mt-0.5 drop-shadow">
            {localized(locale, banner.subtitle, banner.subtitleEn)}
          </p>
        )}
      </div>
    </Wrapper>
  )
}
