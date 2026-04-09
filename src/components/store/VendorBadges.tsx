type BadgeType = "VERIFIED" | "TOP_SELLER" | "HIGH_RATED" | "TRUSTED" | "NEW_VENDOR"

const badgeConfig: Record<BadgeType, { label: string; color: string; icon: string }> = {
  VERIFIED: {
    label: "Verified",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    icon: "🛡️",
  },
  TOP_SELLER: {
    label: "Top Seller",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    icon: "⭐",
  },
  HIGH_RATED: {
    label: "Highly Rated",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    icon: "❤️",
  },
  TRUSTED: {
    label: "Trusted",
    color: "bg-green-50 border-green-200 text-green-700",
    icon: "✓",
  },
  NEW_VENDOR: {
    label: "New",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    icon: "✨",
  },
}

export default function VendorBadges({
  badges,
  size = "md",
  iconOnly = false,
}: {
  badges: { badge: BadgeType }[]
  size?: "sm" | "md"
  iconOnly?: boolean
}) {
  if (badges.length === 0) return null

  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map(({ badge }) => {
        const config = badgeConfig[badge]
        if (iconOnly) {
          return (
            <span
              key={badge}
              title={config.label}
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${config.color}`}
            >
              <span className="text-[10px]">{config.icon}</span>
            </span>
          )
        }
        return (
          <span
            key={badge}
            className={`inline-flex items-center gap-1 rounded-full border font-semibold ${config.color} ${sizeClass}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
        )
      })}
    </div>
  )
}
