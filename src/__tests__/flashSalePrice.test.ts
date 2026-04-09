import { describe, it, expect } from "vitest"
import { applyDiscount, getEffectivePrice, type FlashSaleInfo } from "@/lib/flashSalePrice"

describe("applyDiscount", () => {
  it("applies percentage discount correctly", () => {
    expect(applyDiscount(100, "PERCENTAGE", 10)).toBe(90)
  })

  it("applies fixed discount correctly", () => {
    expect(applyDiscount(100, "FIXED", 10)).toBe(90)
  })

  it("100% discount returns 0", () => {
    expect(applyDiscount(100, "PERCENTAGE", 100)).toBe(0)
  })

  it("0% discount returns original price", () => {
    expect(applyDiscount(100, "PERCENTAGE", 0)).toBe(100)
  })

  it("fixed discount larger than price clamps to 0", () => {
    expect(applyDiscount(10, "FIXED", 20)).toBe(0)
  })

  it("handles decimal prices with percentage", () => {
    const result = applyDiscount(19.99, "PERCENTAGE", 15)
    expect(result).toBeCloseTo(16.99, 1)
  })

  it("handles 0 base price", () => {
    expect(applyDiscount(0, "PERCENTAGE", 10)).toBe(0)
  })

  it("50% discount halves the price", () => {
    expect(applyDiscount(100, "PERCENTAGE", 50)).toBe(50)
  })

  it("rounds to 2 decimal places", () => {
    // 33.33... should round cleanly
    const result = applyDiscount(100, "PERCENTAGE", 33)
    expect(result).toBe(67)
  })

  it("fixed discount on exact price returns 0", () => {
    expect(applyDiscount(50, "FIXED", 50)).toBe(0)
  })
})

describe("getEffectivePrice", () => {
  const makeSale = (overrides?: Partial<FlashSaleInfo>): FlashSaleInfo => ({
    salePrice: 40,
    originalPrice: 50,
    discountType: "PERCENTAGE",
    discountValue: 20,
    endTime: "2099-01-01T00:00:00.000Z",
    ...overrides,
  })

  it("returns product price when no variant and no sale", () => {
    expect(getEffectivePrice(50, null, null)).toBe(50)
  })

  it("returns variant price when variant exists and no sale", () => {
    expect(getEffectivePrice(50, 60, null)).toBe(60)
  })

  it("returns salePrice when no variant and sale exists", () => {
    expect(getEffectivePrice(50, null, makeSale({ salePrice: 40 }))).toBe(40)
  })

  it("applies percentage discount to variant price when sale exists", () => {
    const result = getEffectivePrice(50, 60, makeSale({ discountType: "PERCENTAGE", discountValue: 10 }))
    expect(result).toBe(54)
  })

  it("applies fixed discount to variant price when sale exists", () => {
    const result = getEffectivePrice(50, 60, makeSale({ discountType: "FIXED", discountValue: 5 }))
    expect(result).toBe(55)
  })

  it("uses salePrice directly for non-variant products even if discountType set", () => {
    // When variantPrice is null, it should use the pre-computed salePrice, NOT recompute
    const sale = makeSale({ salePrice: 35, discountType: "PERCENTAGE", discountValue: 30 })
    expect(getEffectivePrice(50, null, sale)).toBe(35)
  })

  it("handles 0 variant price with sale", () => {
    expect(getEffectivePrice(50, 0, makeSale({ discountType: "PERCENTAGE", discountValue: 10 }))).toBe(0)
  })
})
