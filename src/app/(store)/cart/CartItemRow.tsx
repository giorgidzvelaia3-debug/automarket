"use client"

import Link from "next/link"
import { useTransition } from "react"
import { removeFromCart, updateCartQuantity } from "@/lib/actions/cart"
import { optimizeImageUrl } from "@/lib/imageUtils"

type CartItem = {
  id: string
  quantity: number
  variantId: string | null
  unitPrice: number
  originalUnitPrice: number
  product: {
    id: string
    slug: string
    name: string
    nameEn: string
    price: unknown
    stock: number
    images: { url: string }[]
  }
  variant?: { id: string; name: string; nameEn: string; price: unknown; stock: number } | null
  vendor: { id: string; name: string; slug: string }
}

export default function CartItemRow({ item }: { item: CartItem }) {
  const [isPending, startTransition] = useTransition()
  const price = item.unitPrice
  const isDiscounted = price < item.originalUnitPrice
  const stock = item.variant ? item.variant.stock : item.product.stock
  const maxQty = Math.min(stock, 10)

  function changeQty(newQty: number) {
    startTransition(async () => {
      await updateCartQuantity(item.id, newQty)
    })
  }

  function remove() {
    startTransition(async () => {
      await removeFromCart(item.id)
    })
  }

  return (
    <div className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      {/* Thumbnail */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {item.product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizeImageUrl(item.product.images[0].url, 128)}
              alt={item.product.nameEn}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-300 text-2xl">□</span>
          )}
        </div>
      </Link>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product.slug}`}>
          <p className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
            {item.product.name}
          </p>
          <p className="text-xs text-gray-400 truncate">{item.product.nameEn}</p>
        </Link>
        {item.variant && (
          <p className="text-xs text-blue-600 font-medium mt-0.5">{item.variant.name}</p>
        )}
        <div className="mt-1 flex items-baseline gap-1.5">
          <p className={`text-sm font-semibold ${isDiscounted ? "text-red-600" : "text-gray-900"}`}>
            ₾{price.toFixed(2)}
          </p>
          {isDiscounted && (
            <p className="text-xs text-gray-400 line-through">₾{item.originalUnitPrice.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden shrink-0">
        <button
          onClick={() => changeQty(item.quantity - 1)}
          disabled={isPending}
          className="px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
        >
          −
        </button>
        <span className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => changeQty(item.quantity + 1)}
          disabled={isPending || item.quantity >= maxQty}
          className="px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <p className="hidden sm:block w-20 text-right text-sm font-semibold text-gray-900 shrink-0">
        ₾{(price * item.quantity).toFixed(2)}
      </p>

      {/* Remove */}
      <button
        onClick={remove}
        disabled={isPending}
        className="shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 disabled:opacity-40 transition-colors"
        aria-label="Remove"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
