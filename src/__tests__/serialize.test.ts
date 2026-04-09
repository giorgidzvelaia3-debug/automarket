import { describe, it, expect } from "vitest"
import { toNum, toNumOrNull, serializeCartItem, serializeWithdrawal } from "@/lib/serialize"

describe("toNum", () => {
  it("converts null to 0", () => {
    expect(toNum(null)).toBe(0)
  })

  it("converts undefined to 0", () => {
    expect(toNum(undefined)).toBe(0)
  })

  it("passes through numbers", () => {
    expect(toNum(42)).toBe(42)
  })

  it("converts numeric strings", () => {
    expect(toNum("42.5")).toBe(42.5)
  })

  it("converts 0 correctly", () => {
    expect(toNum(0)).toBe(0)
  })

  it("converts negative numbers", () => {
    expect(toNum(-10)).toBe(-10)
  })

  it("converts Prisma Decimal-like object via Number()", () => {
    // Prisma Decimal has a toString that Number() can parse
    const decimal = { toString: () => "99.50" }
    expect(toNum(decimal)).toBe(99.5)
  })
})

describe("toNumOrNull", () => {
  it("returns null for null", () => {
    expect(toNumOrNull(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(toNumOrNull(undefined)).toBeNull()
  })

  it("converts numbers", () => {
    expect(toNumOrNull(42)).toBe(42)
  })

  it("converts 0 (not null)", () => {
    expect(toNumOrNull(0)).toBe(0)
  })
})

describe("serializeCartItem", () => {
  it("serializes product price", () => {
    const item = {
      id: "1",
      quantity: 2,
      price: null as unknown,
      product: { id: "p1", price: "25.50" as unknown },
      variant: null,
    }
    const result = serializeCartItem(item)
    expect(result.product.price).toBe(25.5)
  })

  it("serializes cart item stored price", () => {
    const item = {
      id: "1",
      quantity: 1,
      price: "19.99" as unknown,
      product: { id: "p1", price: "25.00" as unknown },
      variant: null,
    }
    const result = serializeCartItem(item)
    expect(result.price).toBe(19.99)
  })

  it("handles null price as null (not 0)", () => {
    const item = {
      id: "1",
      quantity: 1,
      product: { id: "p1", price: "10" as unknown },
      variant: null,
    }
    const result = serializeCartItem(item)
    expect(result.price).toBeNull()
  })

  it("serializes variant price", () => {
    const item = {
      id: "1",
      quantity: 1,
      price: null as unknown,
      product: { id: "p1", price: "25.00" as unknown },
      variant: { id: "v1", name: "1L", price: "30.00" as unknown },
    }
    const result = serializeCartItem(item)
    expect(result.variant!.price).toBe(30)
  })

  it("null variant stays null", () => {
    const item = {
      id: "1",
      quantity: 1,
      price: null as unknown,
      product: { id: "p1", price: "10" as unknown },
      variant: null,
    }
    const result = serializeCartItem(item)
    expect(result.variant).toBeNull()
  })

  it("preserves other fields", () => {
    const item = {
      id: "abc",
      quantity: 5,
      variantId: "v123",
      price: null as unknown,
      product: { id: "p1", price: "10" as unknown, name: "Widget" },
      variant: null,
    }
    const result = serializeCartItem(item)
    expect(result.id).toBe("abc")
    expect(result.quantity).toBe(5)
    expect(result.variantId).toBe("v123")
    expect(result.product.name).toBe("Widget")
  })
})

describe("serializeWithdrawal", () => {
  it("converts amount to number", () => {
    const w = { id: "1", amount: "150.75" as unknown, status: "PENDING" }
    const result = serializeWithdrawal(w)
    expect(result.amount).toBe(150.75)
  })

  it("preserves other fields", () => {
    const w = { id: "w1", amount: "50" as unknown, status: "PAID", vendorId: "v1" }
    const result = serializeWithdrawal(w)
    expect(result.id).toBe("w1")
    expect(result.status).toBe("PAID")
    expect(result.vendorId).toBe("v1")
  })
})
