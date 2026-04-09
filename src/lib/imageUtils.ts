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
