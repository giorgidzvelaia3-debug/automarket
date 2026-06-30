import type { SourceAdapter } from "./types"
import { amboliAdapter } from "./adapters/amboli"
import { otomotorsAdapter } from "./adapters/otomotors"
import { rpmAdapter } from "./adapters/rpm"

const adapters: Record<string, SourceAdapter> = {
  [amboliAdapter.slug]: amboliAdapter,
  [otomotorsAdapter.slug]: otomotorsAdapter,
  [rpmAdapter.slug]: rpmAdapter,
}

export function getAdapter(slug: string): SourceAdapter | null {
  return adapters[slug] ?? null
}

export function listAdapterSlugs(): string[] {
  return Object.keys(adapters)
}
