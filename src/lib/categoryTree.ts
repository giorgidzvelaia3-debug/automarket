export type CategoryFlat = {
  id: string
  name: string
  nameEn: string
  slug: string
  icon: string | null
  parentId: string | null
}

export type CategoryNode = CategoryFlat & {
  children: CategoryNode[]
}

/** Build a tree from a flat category list (max 2 levels). */
export function buildCategoryTree(flat: CategoryFlat[]): CategoryNode[] {
  const childrenMap = new Map<string, CategoryNode[]>()

  for (const cat of flat) {
    if (cat.parentId) {
      const siblings = childrenMap.get(cat.parentId) ?? []
      siblings.push({ ...cat, children: [] })
      childrenMap.set(cat.parentId, siblings)
    }
  }

  return flat
    .filter((c) => !c.parentId)
    .map((c) => ({ ...c, children: childrenMap.get(c.id) ?? [] }))
}

/** Return the category ID plus all its descendant IDs. */
export function getAllDescendantIds(
  flat: CategoryFlat[],
  categoryId: string,
): string[] {
  const ids = [categoryId]
  for (const cat of flat) {
    if (cat.parentId === categoryId) ids.push(cat.id)
  }
  return ids
}

/** Return breadcrumb path: [root, ..., self]. */
export function getCategoryBreadcrumb(
  flat: CategoryFlat[],
  categoryId: string,
): CategoryFlat[] {
  const map = new Map(flat.map((c) => [c.id, c]))
  const crumbs: CategoryFlat[] = []
  let current = map.get(categoryId)
  while (current) {
    crumbs.unshift(current)
    current = current.parentId ? map.get(current.parentId) : undefined
  }
  return crumbs
}
