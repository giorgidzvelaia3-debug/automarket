import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { StarDisplay } from "@/components/store/StarRating"
import AddToCartButton from "@/components/store/AddToCartButton"
import CompareRemoveButton from "./CompareRemoveButton"

export default async function ComparePage(props: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsParam } = await props.searchParams
  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  const ids = idsParam?.split(",").filter(Boolean).slice(0, 3) ?? []

  if (ids.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-4xl mb-4">⇄</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No products to compare</h1>
        <p className="text-sm text-gray-500 mb-6">
          Add products by clicking the &ldquo;Compare&rdquo; button on product cards.
        </p>
        <Link
          href="/vendors"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      price: true,
      stock: true,
      vendorId: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      category: { select: { nameEn: true, name: true } },
      vendor: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } },
    },
  })

  // Maintain the requested order
  const productMap = new Map(products.map((p) => [p.id, p]))
  const ordered = ids.map((id) => productMap.get(id)).filter(Boolean) as typeof products

  if (ordered.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-sm text-gray-500">The selected products are no longer available.</p>
        <Link href="/vendors" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Browse Products
        </Link>
      </div>
    )
  }

  const colWidth = ordered.length === 1 ? "max-w-md" : ordered.length === 2 ? "max-w-3xl" : "max-w-5xl"

  const rows: { label: string; render: (p: (typeof ordered)[0]) => React.ReactNode }[] = [
    {
      label: "Image",
      render: (p) => (
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {p.images[0] ? (
            <Image
              src={p.images[0].url}
              alt={p.nameEn}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-300 text-4xl">□</span>
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Name",
      render: (p) => (
        <Link href={`/products/${p.slug}`} className="hover:text-blue-600 transition-colors">
          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-400">{p.nameEn}</p>
        </Link>
      ),
    },
    {
      label: "Price",
      render: (p) => (
        <p className="text-lg font-extrabold text-gray-900">₾{Number(p.price).toFixed(2)}</p>
      ),
    },
    {
      label: "Category",
      render: (p) => (
        <p className="text-sm text-gray-700">{p.category.nameEn} / {p.category.name}</p>
      ),
    },
    {
      label: "Vendor",
      render: (p) => (
        <Link
          href={`/vendors/${p.vendor.slug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          {p.vendor.name}
        </Link>
      ),
    },
    {
      label: "Rating",
      render: (p) => {
        const rc = p.reviews.length
        if (rc === 0) return <span className="text-xs text-gray-400">No reviews</span>
        const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / rc
        return <StarDisplay rating={avg} count={rc} size="sm" />
      },
    },
    {
      label: "Stock",
      render: (p) => (
        <p className={`text-sm font-medium ${p.stock > 0 ? "text-green-600" : "text-red-500"}`}>
          {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
        </p>
      ),
    },
    {
      label: "Description",
      render: (p) => (
        <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed">
          {p.descriptionEn || p.description || "—"}
        </p>
      ),
    },
    {
      label: "Add to Cart",
      render: (p) => (
        <AddToCartButton
          productId={p.id}
          stock={p.stock}
          isLoggedIn={isLoggedIn}
          vendorId={p.vendorId}
          vendorName={p.vendor.name}
          vendorSlug={p.vendor.slug}
          price={Number(p.price)}
          name={p.name}
          nameEn={p.nameEn}
          image={p.images[0]?.url ?? null}
        />
      ),
    },
  ]

  return (
    <div className={`${colWidth} mx-auto px-4 sm:px-6 lg:px-8 py-12`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ordered.length} product{ordered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Remove buttons row */}
        <div className={`grid border-b border-gray-100`} style={{ gridTemplateColumns: `140px repeat(${ordered.length}, 1fr)` }}>
          <div className="px-4 py-3" />
          {ordered.map((p) => (
            <div key={p.id} className="px-4 py-3 flex justify-end">
              <CompareRemoveButton productId={p.id} ids={ids} />
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid border-b border-gray-100 last:border-b-0"
            style={{ gridTemplateColumns: `140px repeat(${ordered.length}, 1fr)` }}
          >
            <div className="px-4 py-4 bg-gray-50 flex items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {row.label}
              </span>
            </div>
            {ordered.map((p) => (
              <div key={p.id} className="px-4 py-4">
                {row.render(p)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
