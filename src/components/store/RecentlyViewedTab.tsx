"use client"

import Link from "next/link"
import Image from "next/image"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { useRecentlyViewed } from "@/lib/useRecentlyViewed"
import WishlistButton from "./WishlistButton"
import type { useTranslations } from "next-intl"

export default function RecentlyViewedTab({
  items,
  locale,
  isLoggedIn,
  onClose,
  t,
}: {
  items: ReturnType<typeof useRecentlyViewed>["items"]
  locale: string
  isLoggedIn: boolean
  onClose: () => void
  t: ReturnType<typeof useTranslations<"Cart">>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-900 mb-1">{t("noRecentItems")}</p>
        <p className="text-xs text-gray-400">{t("noRecentHint")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.slug}`}
          onClick={onClose}
          className="group rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
        >
          <div className="relative aspect-square bg-gray-100">
            {item.image ? (
              <Image src={optimizeImageUrl(item.image, 200)} alt="" fill sizes="180px" className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-300 text-2xl">□</span>
              </div>
            )}
            <div className="absolute top-1.5 right-1.5 z-10" onClick={(e) => e.preventDefault()}>
              <WishlistButton
                productId={item.id}
                isWishlisted={false}
                isLoggedIn={isLoggedIn}
                size="sm"
              />
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
              {localized(locale, item.name, item.nameEn)}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">₾{item.price.toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
