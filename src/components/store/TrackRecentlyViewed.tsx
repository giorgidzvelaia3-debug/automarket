"use client"

import { useEffect } from "react"
import { useRecentlyViewed } from "@/lib/useRecentlyViewed"

export default function TrackRecentlyViewed({
  id,
  slug,
  name,
  nameEn,
  price,
  image,
}: {
  id: string
  slug: string
  name: string
  nameEn: string
  price: number
  image: string | null
}) {
  const { add } = useRecentlyViewed()

  useEffect(() => {
    add({ id, slug, name, nameEn, price, image })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
