import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ProductForm from "./ProductForm"

export default async function NewProductPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  })

  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { nameEn: "asc" },
    select: {
      id: true, nameEn: true, name: true,
      children: {
        orderBy: { nameEn: "asc" },
        select: { id: true, nameEn: true, name: true },
      },
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/vendor/products"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">New Product</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Product will be saved as a draft. Publish it from the products list.
        </p>
      </div>

      <ProductForm categories={categories} error={error} />
    </div>
  )
}
