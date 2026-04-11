import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import GuestWishlistPage from "./GuestWishlistPage"

export default async function WishlistPage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/account/wishlist")
  }

  return <GuestWishlistPage />
}
