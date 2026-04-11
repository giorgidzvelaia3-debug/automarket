import { describe, expect, it } from "vitest"
import {
  filterWishlistProductIds,
  normalizeWishlistProductIds,
  toggleWishlistProductId,
} from "@/lib/wishlistUtils"

describe("normalizeWishlistProductIds", () => {
  it("deduplicates ids while preserving order", () => {
    expect(
      normalizeWishlistProductIds(["prod-1", "prod-2", "prod-1", "prod-3"])
    ).toEqual(["prod-1", "prod-2", "prod-3"])
  })

  it("drops empty ids and trims values", () => {
    expect(
      normalizeWishlistProductIds(["  prod-1  ", "", "   ", "prod-2"])
    ).toEqual(["prod-1", "prod-2"])
  })
})

describe("toggleWishlistProductId", () => {
  it("adds a product when it is missing", () => {
    expect(toggleWishlistProductId(["prod-1"], "prod-2")).toEqual([
      "prod-1",
      "prod-2",
    ])
  })

  it("removes a product when it already exists", () => {
    expect(toggleWishlistProductId(["prod-1", "prod-2"], "prod-1")).toEqual([
      "prod-2",
    ])
  })
})

describe("filterWishlistProductIds", () => {
  it("prunes invalid ids while keeping the saved order", () => {
    expect(
      filterWishlistProductIds(["prod-3", "prod-1", "prod-2"], [
        "prod-1",
        "prod-3",
      ])
    ).toEqual(["prod-3", "prod-1"])
  })
})
