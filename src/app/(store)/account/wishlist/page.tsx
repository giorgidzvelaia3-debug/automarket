import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getWishlist } from "@/lib/actions/wishlist"
import ProductGrid from "@/components/store/ProductGrid"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const items = await getWishlist()
  const activeItems = items.filter((i) => i.product.status === "ACTIVE")
  const flashSaleMap = await getFlashSalesForProducts(activeItems.map((i) => i.product.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeItems.length} {activeItems.length === 1 ? "item" : "items"}
        </p>
      </div>

      {activeItems.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">♡</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-6">
            Save products you love by tapping the heart icon.
          </p>
          <Link
            href="/vendors"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={activeItems.map((item) => {
            const rc = item.product.reviews.length
            const avg =
              rc > 0
                ? item.product.reviews.reduce((s, r) => s + r.rating, 0) / rc
                : undefined
            return {
              productId: item.productId,
              slug: item.product.slug,
              name: item.product.name,
              nameEn: item.product.nameEn,
              price: Number(item.product.price),
              imageUrl: item.product.images[0]?.url,
              categoryName: item.product.category.nameEn,
              vendorName: item.product.vendor.name,
              avgRating: avg,
              reviewCount: rc > 0 ? rc : undefined,
              isLoggedIn: true,
              wishlist: { isWishlisted: true },
              variants: item.product.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
              flashSale: flashSaleMap.get(item.product.id) ?? null,
            }
          })}
        />
      )}
    </div>
  )
}
