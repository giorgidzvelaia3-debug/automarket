import { describe, it, expect } from "vitest"
import {
  parseBrand,
  parseViscosity,
  parseVolume,
  parseLine,
  buildMatchKey,
  normalizeName,
  slugifyAggregated,
} from "@/lib/scraping/normalize"

describe("parseViscosity", () => {
  it("normalizes common viscosity forms", () => {
    expect(parseViscosity("Mobil 1FS 5W40 5ლ")).toBe("5W40")
    expect(parseViscosity("ENI i-Sint tech F plus 0W-30 1L")).toBe("0W30")
    expect(parseViscosity("castrol 5w30 4l")).toBe("5W30")
    expect(parseViscosity("TOTAL 10 W 40")).toBe("10W40")
  })
  it("returns null when absent", () => {
    expect(parseViscosity("Brake fluid DOT4")).toBeNull()
  })
})

describe("parseVolume", () => {
  it("parses Latin and Georgian volume units", () => {
    expect(parseVolume("Mobil 1FS 5W40 5ლ (ძრავის ზეთი)")).toBe("5L")
    expect(parseVolume("Castrol 5W30 4 L")).toBe("4L")
    expect(parseVolume("ENI 0W30 1 ლიტრ")).toBe("1L")
    expect(parseVolume("Some oil 0.946L")).toBe("0.946L")
    expect(parseVolume("oil 4,5 ლ")).toBe("4.5L")
  })
  it("returns null when absent", () => {
    expect(parseVolume("Mobil 1FS 5W40")).toBeNull()
  })
})

describe("parseBrand", () => {
  it("matches brands by Latin and Georgian aliases", () => {
    expect(parseBrand("Mobil 1FS 5W40 5ლ")).toBe("MOBIL")
    expect(parseBrand("ENI i-Sint tech 0W30 1L")).toBe("ENI")
    expect(parseBrand("ფანფარო VSX 5W40 4 L")).toBe("FANFARO")
    expect(parseBrand("Castrol EDGE 5W30")).toBe("CASTROL")
  })
  it("returns null for unknown brand", () => {
    expect(parseBrand("NoName super oil 5W30 4L")).toBeNull()
  })
})

describe("parseLine", () => {
  it("extracts the product line for multi-line brands", () => {
    expect(parseLine("Castrol EDGE 5W-30 C3 4L", "CASTROL")).toBe("EDGE")
    expect(parseLine("Castrol Magnatec 5W30 AP 4ლ", "CASTROL")).toBe("MAGNATEC")
    expect(parseLine("Shell Helix Ultra 5W40 1L", "SHELL")).toBe("HELIX")
  })
  it("returns null when brand has no line dictionary or no line matches", () => {
    expect(parseLine("Wolver 5W30 4L", "WOLVER")).toBeNull()
    expect(parseLine("Castrol 5W30 4L", "CASTROL")).toBeNull()
  })
})

describe("buildMatchKey", () => {
  it("requires brand+viscosity+volume and folds in the line", () => {
    expect(buildMatchKey({ brand: "MOBIL", viscosity: "5W40", volume: "5L" })).toBe("mobil||5w40|5l")
    expect(buildMatchKey({ brand: "CASTROL", line: "EDGE", viscosity: "5W30", volume: "4L" })).toBe("castrol|edge|5w30|4l")
    expect(buildMatchKey({ brand: "MOBIL", viscosity: null, volume: "5L" })).toBeNull()
  })
})

describe("normalizeName", () => {
  it("derives a full identity for a typical amboli oil", () => {
    expect(normalizeName("Mobil 1FS 5W40 5ლ (ძრავის ზეთი)")).toEqual({
      brand: "MOBIL",
      viscosity: "5W40",
      volume: "5L",
      line: null,
      matchKey: "mobil||5w40|5l",
    })
  })
  it("two sources naming the same product produce the same matchKey", () => {
    const a = normalizeName("Mobil 1 FS 5W-40 5L")
    const b = normalizeName("მობილ 1FS 5W40 5 ლიტრ")
    expect(a.matchKey).toBe(b.matchKey)
  })
  it("different Castrol lines with same viscosity+volume do NOT collide", () => {
    const edge = normalizeName("Castrol EDGE 5W-30 C3 4L (ძრავის ზეთი)")
    const magnatec = normalizeName("Castrol Magnatec 5W30 AP 4ლ (ძრავის ზეთი)")
    expect(edge.matchKey).toBe("castrol|edge|5w30|4l")
    expect(magnatec.matchKey).toBe("castrol|magnatec|5w30|4l")
    expect(edge.matchKey).not.toBe(magnatec.matchKey)
  })
})

describe("slugifyAggregated", () => {
  it("produces an ASCII slug", () => {
    expect(slugifyAggregated("Mobil 1FS 5W40 5ლ (ძრავის ზეთი)")).toBe("mobil-1fs-5w40-5")
  })
})
