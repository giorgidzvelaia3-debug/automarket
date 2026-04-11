import type { FlashSaleInfo } from "./flashSalePrice"
import { applyDiscount } from "./flashSalePrice"
import { localized } from "./localeName"

export type ProductCardVariant = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
}

export type ProductCardProps = {
  productId: string
  slug: string
  name: string
  nameEn: string
  price: number
  stock?: number
  imageUrl?: string | null
  categoryName?: string
  vendorName?: string
  vendorSlug?: string
  vendorId?: string
  avgRating?: number
  reviewCount?: number
  isLoggedIn?: boolean
  isWishlisted?: boolean
  wishlist?: {
    isWishlisted: boolean
  }
  variants?: ProductCardVariant[]
  flashSale?: FlashSaleInfo | null
  priority?: boolean
  isNew?: boolean
}

type ProductCardSource = {
  id: string
  slug: string
  name: string
  nameEn: string
  price: unknown
  stock?: number | null
  createdAt?: string | Date | null
  vendorId?: string | null
  images?: { url: string }[]
  category?: { name?: string | null; nameEn?: string | null } | null
  vendor?: { id?: string | null; name: string; slug?: string | null } | null
  reviews?: { rating: number }[]
  avgRating?: number
  reviewCount?: number
  variants?: Array<{
    id: string
    name: string
    nameEn: string
    price: unknown
    stock: number
  }>
}

type BuildProductCardOptions = {
  locale?: string
  flashSale?: FlashSaleInfo | null
  categoryName?: string
  vendorName?: string
  vendorSlug?: string
  vendorId?: string
  isLoggedIn?: boolean
  isWishlisted?: boolean
  avgRating?: number
  reviewCount?: number
  priority?: boolean
}

const NEW_PRODUCT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export function isProductNew(
  createdAt?: string | Date | null,
  now: number = Date.now()
): boolean {
  if (!createdAt) return false
  return now - new Date(createdAt).getTime() < NEW_PRODUCT_WINDOW_MS
}

export function toProductCardProps(
  product: ProductCardSource,
  options: BuildProductCardOptions = {}
): ProductCardProps {
  const reviewCount =
    options.reviewCount ??
    product.reviewCount ??
    product.reviews?.length

  const avgRating =
    options.avgRating ??
    product.avgRating ??
    (reviewCount && product.reviews
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : undefined)

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    nameEn: product.nameEn,
    price: Number(product.price ?? 0),
    stock: product.stock ?? undefined,
    imageUrl: product.images?.[0]?.url ?? null,
    categoryName:
      options.categoryName ??
      (options.locale && product.category
        ? localized(options.locale, product.category.name, product.category.nameEn)
        : undefined),
    vendorName: options.vendorName ?? product.vendor?.name ?? undefined,
    vendorSlug: options.vendorSlug ?? product.vendor?.slug ?? undefined,
    vendorId: options.vendorId ?? product.vendorId ?? product.vendor?.id ?? undefined,
    avgRating: reviewCount && reviewCount > 0 ? avgRating : undefined,
    reviewCount: reviewCount && reviewCount > 0 ? reviewCount : undefined,
    isLoggedIn: options.isLoggedIn,
    isWishlisted: options.isWishlisted,
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      name: variant.name,
      nameEn: variant.nameEn,
      price: Number(variant.price ?? 0),
      stock: variant.stock,
    })),
    flashSale: options.flashSale ?? null,
    priority: options.priority,
    isNew: isProductNew(product.createdAt),
  }
}

export function getProductCardState({
  price,
  stock,
  variants,
  flashSale,
}: Pick<ProductCardProps, "price" | "stock" | "variants" | "flashSale">) {
  const allVariants = variants ?? []
  const hasVariants = allVariants.length > 0
  const availableVariants = allVariants.filter((variant) => variant.stock > 0)
  const variantPool = availableVariants.length > 0 ? availableVariants : allVariants
  const outOfStock = hasVariants ? availableVariants.length === 0 : stock !== undefined && stock === 0

  let displayPrice = price
  let originalDisplayPrice = price

  if (hasVariants && variantPool.length > 0) {
    const originalVariantPrices = variantPool.map((variant) => variant.price)
    const discountedVariantPrices = variantPool.map((variant) =>
      flashSale
        ? applyDiscount(variant.price, flashSale.discountType, flashSale.discountValue)
        : variant.price
    )

    displayPrice = Math.min(...discountedVariantPrices)
    originalDisplayPrice = Math.min(...originalVariantPrices)
  } else if (flashSale) {
    displayPrice = flashSale.salePrice
    originalDisplayPrice = price
  }

  const isDiscounted = flashSale != null && displayPrice < originalDisplayPrice
  const discountBadge = flashSale
    ? flashSale.discountType === "PERCENTAGE"
      ? `-${flashSale.discountValue}%`
      : `-₾${flashSale.discountValue}`
    : null

  return {
    hasVariants,
    variantCount: allVariants.length,
    availableVariants,
    outOfStock,
    displayPrice,
    originalDisplayPrice,
    isDiscounted,
    discountBadge,
  }
}
