// Pure normalization helpers used to derive a product's identity from its
// (often messy, bilingual) name so that the same physical product from
// different sources can be proposed as a match.
//
// These functions are pure and unit-tested (see normalize.test.ts).

/** Curated brand dictionary. First match wins. Latin + common Georgian forms. */
const BRANDS: { canonical: string; aliases: string[] }[] = [
  { canonical: "TOTAL", aliases: ["total", "ტოტალ"] },
  { canonical: "CASTROL", aliases: ["castrol", "კასტرول", "კასტროლ"] },
  { canonical: "MOBIL", aliases: ["mobil 1", "mobil1", "mobil", "მობილ"] },
  { canonical: "SHELL", aliases: ["shell", "შელ"] },
  { canonical: "LIQUI MOLY", aliases: ["liqui moly", "liqui-moly", "liquimoly", "ლიქვი მოლი"] },
  { canonical: "ELF", aliases: ["elf", "ელფ"] },
  { canonical: "ENI", aliases: ["eni", "ენი"] },
  { canonical: "FANFARO", aliases: ["fanfaro", "ფანფარო"] },
  { canonical: "MOTUL", aliases: ["motul", "მოტულ"] },
  { canonical: "VALVOLINE", aliases: ["valvoline", "ვალვოლინ"] },
  { canonical: "ZIC", aliases: ["zic", "ზიკ"] },
  { canonical: "RAVENOL", aliases: ["ravenol", "რავენოლ"] },
  { canonical: "GULF", aliases: ["gulf", "გალფ"] },
  { canonical: "PETRONAS", aliases: ["petronas", "პეტრონას"] },
  { canonical: "MANNOL", aliases: ["mannol", "მანოლ"] },
  { canonical: "KIXX", aliases: ["kixx", "კიქს"] },
  { canonical: "IDEMITSU", aliases: ["idemitsu", "იდემიცუ"] },
  { canonical: "TOYOTA", aliases: ["toyota", "ტოიოტა"] },
  { canonical: "BMW", aliases: ["bmw"] },
  { canonical: "MEGUIN", aliases: ["meguin", "მეგუინ"] },
  // Budget / regional brands (seen on otomotors.shop)
  { canonical: "WOLVER", aliases: ["wolver", "ვოლვერ"] },
  { canonical: "TAKASAKI", aliases: ["takasaki", "ტაკასაკი"] },
  { canonical: "YUKO", aliases: ["yuko", "იუკო"] },
  { canonical: "GOODYEAR", aliases: ["goodyear", "გუდიერ"] },
  { canonical: "ROUTE", aliases: ["route", "როუტ"] },
  { canonical: "XOVO", aliases: ["xovo"] },
  { canonical: "AUSTER", aliases: ["auster", "აუსტერ"] },
  { canonical: "E-TEC", aliases: ["e-tec", "etec", "ე-ტეკ"] },
  { canonical: "NORD KAPP", aliases: ["nord kapp", "nordkapp"] },
  { canonical: "JAPAN #1 OIL", aliases: ["japan#1 oil", "japan #1 oil", "japan#1", "japan #1"] },
  { canonical: "BITTERFELD", aliases: ["bitterfeld lubricants", "bitterfeld"] },
  { canonical: "QUAX", aliases: ["quax"] },
  { canonical: "MULLER OIL", aliases: ["muller oil", "muller", "მიულერ"] },
  { canonical: "BELL1", aliases: ["bell1", "bell 1"] },
  { canonical: "SHINOLUB", aliases: ["shinolub"] },
]

// Product lines/series for multi-line premium brands. Two oils that share
// brand + viscosity + volume but differ in line (Castrol EDGE vs MAGNATEC) are
// DIFFERENT products, so the line is part of the identity key.
const LINES: Record<string, string[]> = {
  CASTROL: ["EDGE", "MAGNATEC", "GTX", "CRB", "POWER1", "ACTEVO", "TRANSMAX", "VECTON"],
  SHELL: ["HELIX", "RIMULA", "ADVANCE", "SPIRAX"],
  TOTAL: ["QUARTZ", "INEO", "RUBIA", "CLASSIC"],
  MOBIL: ["DELVAC", "SUPER", "ESP", "PEAK"],
  BMW: ["TWINPOWER", "LONGLIFE"],
  ENI: ["I-SINT", "I-RIDE", "I-BASE"],
  SHINOLUB: [],
  LIQUI_MOLY: ["MOLYGEN", "LEICHTLAUF", "SYNTHOIL", "TOPTEC", "SPECIALTEC", "MOS2"],
}

export function parseLine(name: string, brand: string | null): string | null {
  if (!brand) return null
  const lines = LINES[brand]
  if (!lines || lines.length === 0) return null
  const compact = name.toLowerCase().replace(/[\s_-]/g, "")
  for (const line of lines) {
    if (compact.includes(line.toLowerCase().replace(/[\s_-]/g, ""))) return line
  }
  return null
}

export function parseBrand(name: string): string | null {
  const lower = name.toLowerCase()
  for (const { canonical, aliases } of BRANDS) {
    for (const alias of aliases) {
      // word-ish boundary check to avoid partial hits inside other words
      const re = new RegExp(`(^|[^a-zა-ჰ0-9])${escapeRegex(alias)}([^a-zა-ჰ0-9]|$)`, "i")
      if (re.test(lower)) return canonical
    }
  }
  return null
}

/** "5W-30", "5w30", "0W20" → "5W30" */
export function parseViscosity(name: string): string | null {
  const m = name.match(/\b(\d{1,2})\s*[wW]\s*-?\s*(\d{2})\b/)
  if (!m) return null
  return `${m[1]}W${m[2]}`.toUpperCase()
}

/** "5ლ", "4 L", "1 ლიტრ", "0.946L", "208 ლ" → normalized like "5L" / "0.946L" */
export function parseVolume(name: string): string | null {
  // Note: no trailing \b — Georgian letters (ლ) are not ASCII word chars, so a
  // word boundary after them never matches. Longest unit alternatives first.
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(ლიტრ|litre|liter|ლ|l)(?![a-z])/i)
  if (!m) return null
  const num = m[1].replace(",", ".")
  // strip trailing ".0"
  const clean = num.replace(/\.0+$/, "")
  return `${clean}L`
}

export type NormalizedIdentity = {
  brand: string | null
  viscosity: string | null
  volume: string | null
  line: string | null
  matchKey: string | null
}

export function normalizeName(name: string): NormalizedIdentity {
  const brand = parseBrand(name)
  const viscosity = parseViscosity(name)
  const volume = parseVolume(name)
  const line = parseLine(name, brand)
  return { brand, viscosity, volume, line, matchKey: buildMatchKey({ brand, viscosity, volume, line }) }
}

/**
 * Identity key: brand + line + viscosity + volume. Brand/viscosity/volume are
 * required; line is included when known (it separates e.g. Castrol EDGE from
 * MAGNATEC). Same key across stores = candidate for the same product.
 */
export function buildMatchKey({
  brand,
  viscosity,
  volume,
  line,
}: {
  brand: string | null
  viscosity: string | null
  volume: string | null
  line?: string | null
}): string | null {
  if (!brand || !viscosity || !volume) return null
  return `${brand}|${line ?? ""}|${viscosity}|${volume}`.toLowerCase()
}

/**
 * Confidence that a freshly-scraped offer matches an existing canonical product
 * (or another offer) sharing the same matchKey.
 *   - all three components present + exact existing key  → 95
 *   - all three present (new pairing across sources)     → 80
 *   - partial                                            → 40
 */
export function scoreConfidence(
  identity: NormalizedIdentity,
  { existingCanonical }: { existingCanonical: boolean }
): number {
  const full = Boolean(identity.brand && identity.viscosity && identity.volume)
  if (full && existingCanonical) return 95
  if (full) return 80
  return 40
}

/** Slugify a name the same way products.ts toSlug does (ASCII-only). */
export function slugifyAggregated(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
