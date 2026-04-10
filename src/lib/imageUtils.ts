/**
 * Cloudinary URL optimization helper.
 * Safe to import in both server and client components (no Node.js dependencies).
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  width: number = 400
): string {
  if (!url) return ""
  if (!url.includes("cloudinary.com")) return url
  if (url.includes("f_auto")) return url // already optimized
  return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`)
}

/**
 * Generate a tiny blurred placeholder from a Cloudinary URL.
 * Returns a data URI of a 10px wide blurred image for use as blurDataURL.
 */
export function blurDataUrl(url: string | null | undefined): string | undefined {
  if (!url || !url.includes("cloudinary.com")) return undefined
  const base = url.replace("/upload/", "/upload/w_10,h_10,c_fill,f_webp,q_10,e_blur:400/")
  return base
}
