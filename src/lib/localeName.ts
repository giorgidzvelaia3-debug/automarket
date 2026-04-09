/**
 * Pick the display name based on current locale.
 * Georgian locale → Georgian name, everything else → English name.
 * Falls back to whichever is available.
 */
export function localized(
  locale: string,
  ka: string | null | undefined,
  en: string | null | undefined
): string {
  if (locale === "ka") return ka || en || ""
  return en || ka || ""
}
