import { describe, expect, it } from "vitest"
import { getWishlistProductIdsToCreate } from "@/lib/wishlistUtils"

describe("getWishlistProductIdsToCreate", () => {
  it("returns only ids that are not already in the wishlist", () => {
    expect(
      getWishlistProductIdsToCreate(["prod-1", "prod-3"], [
        "prod-1",
        "prod-2",
        "prod-3",
        "prod-4",
      ])
    ).toEqual(["prod-2", "prod-4"])
  })

  it("ignores duplicate incoming ids", () => {
    expect(
      getWishlistProductIdsToCreate(["prod-1"], [
        "prod-2",
        "prod-2",
        "prod-3",
        "prod-3",
      ])
    ).toEqual(["prod-2", "prod-3"])
  })
})
