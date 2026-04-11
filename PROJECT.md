# AutoMarket — Multi-Vendor Automotive Parts Marketplace

Georgian automotive parts e-commerce platform with vendor management, flash sales, product bundles, and bilingual support.

## Tech Stack

- **Framework:** Next.js 16.2 (App Router, Turbopack, Server Components)
- **Database:** PostgreSQL (Neon) via Prisma 7.6 + PrismaPg adapter
- **Auth:** NextAuth v5 (JWT, Credentials provider)
- **i18n:** next-intl (Georgian / English)
- **Styling:** Tailwind CSS 4
- **Images:** Cloudinary
- **PDF:** jsPDF
- **Testing:** Vitest
- **Deployment:** Vercel

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (store)/             # Customer-facing storefront
│   │   ├── page.tsx         # Homepage (banners, categories, products)
│   │   ├── shop/            # Shop with filters, sorting, pagination
│   │   ├── products/[slug]/ # Product detail (gallery, variants, bundles)
│   │   ├── vendors/[slug]/  # Vendor store page
│   │   ├── categories/[slug]/ # Category listing
│   │   ├── search/          # Search results
│   │   ├── flash-sales/     # Active flash sales
│   │   ├── compare/         # Product comparison (max 3)
│   │   ├── cart/            # Cart page
│   │   ├── checkout/        # Checkout + success
│   │   └── account/         # Orders, wishlist, messages, returns, profile
│   ├── (vendor)/            # Vendor dashboard
│   │   └── vendor/
│   │       ├── dashboard/   # KPIs, revenue chart
│   │       ├── products/    # CRUD, variants, images, bundles
│   │       ├── orders/      # Order management
│   │       ├── flash-sales/ # Create/edit flash sales
│   │       ├── coupons/     # Vendor coupons
│   │       ├── messages/    # Customer messaging
│   │       ├── returns/     # Return request handling
│   │       ├── balance/     # Withdrawals
│   │       ├── earnings/    # Revenue analytics
│   │       └── profile/     # Store settings, vacation mode
│   ├── (admin)/             # Admin panel
│   │   └── admin/
│   │       ├── vendors/     # Approve/suspend vendors
│   │       ├── categories/  # Category management
│   │       ├── orders/      # All orders
│   │       ├── returns/     # All returns
│   │       ├── banners/     # Homepage banner management
│   │       ├── flash-sales/ # Monitor flash sales
│   │       ├── coupons/     # Marketplace coupons
│   │       ├── commission/  # Commission settings
│   │       ├── withdrawals/ # Withdrawal processing
│   │       ├── earnings/    # Platform earnings
│   │       └── settings/    # Site settings
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── upload/          # Cloudinary image upload
│       ├── search/suggestions/ # Search autocomplete
│       └── cron/            # Flash sale & vacation auto-end
├── components/
│   ├── ChatWindow.tsx       # Shared messaging component
│   ├── SidebarNav.tsx       # Admin/vendor sidebar
│   └── store/               # 25+ store components
│       ├── ProductCard.tsx
│       ├── CartDrawer.tsx
│       ├── SearchBar.tsx
│       ├── AuthModal.tsx
│       ├── MobileMenu.tsx
│       ├── HeroBannerCarousel.tsx
│       ├── NavigationProgress.tsx
│       └── ...
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # NextAuth config
│   ├── authHelpers.ts       # requireUser, requireAdmin, requireApprovedVendor
│   ├── flashSalePrice.ts    # applyDiscount, getEffectivePrice
│   ├── guestCart.ts         # localStorage guest cart
│   ├── localeName.ts        # localized(locale, ka, en)
│   ├── imageUtils.ts        # Cloudinary URL optimization
│   ├── serialize.ts         # Decimal serialization
│   ├── generateInvoice.ts   # PDF invoice generation
│   ├── authContext.tsx       # Auth state provider
│   ├── authModalContext.tsx  # Auth modal state
│   ├── cartDrawerContext.tsx # Cart drawer state
│   ├── compareContext.tsx    # Compare state
│   ├── useRecentlyViewed.ts # Recently viewed hook (localStorage)
│   ├── useSearchHistory.ts  # Search history hook (localStorage)
│   └── actions/             # 20+ server action files
│       ├── cart.ts
│       ├── orders/
│       ├── products.ts
│       ├── variants.ts
│       ├── bundles.ts
│       ├── flashSales.ts
│       ├── coupons.ts
│       ├── reviews.ts
│       ├── messages.ts
│       ├── returns.ts
│       ├── banners.ts
│       └── ...
├── generated/prisma/        # Auto-generated Prisma client
└── i18n/
    └── request.ts           # next-intl locale resolver
```

---

## Data Models (Prisma)

### Core
| Model | Purpose |
|-------|---------|
| `User` | Users with roles: ADMIN, VENDOR, BUYER |
| `Vendor` | Store profile, vacation mode, order limits |
| `Category` | Hierarchical product categories |
| `Product` | Products with price, stock, status |
| `ProductVariant` | Variant-specific price/stock/SKU |
| `ProductImage` | Images for products and variants (variantId nullable) |
| `Review` | Ratings and comments |

### Orders & Cart
| Model | Purpose |
|-------|---------|
| `CartItem` | Cart with variant support, stored flash sale price |
| `Order` | Orders with status tracking |
| `OrderItem` | Items with commission breakdown |

### Promotions
| Model | Purpose |
|-------|---------|
| `FlashSale` / `FlashSaleItem` | Time-limited discounts (product or category) |
| `Coupon` / `CouponUse` | Discount codes with scopes |
| `ProductBundle` | "Better Together" cross-sell bundles |
| `Banner` | Homepage hero/side banners |

### Finance
| Model | Purpose |
|-------|---------|
| `CommissionSetting` | Commission rates (global → vendor → category → product) |
| `VendorWithdrawal` | Payout requests |
| `VendorBadge` | Earned badges (TOP_SELLER, HIGH_RATED, etc.) |

### Returns
| Model | Purpose |
|-------|---------|
| `ReturnRequest` | Return/warranty requests |
| `ReturnItem` | Items within returns |

---

## Pricing Logic

### Price Calculation Flow
```
Product base price
  → Variant price (overrides base if selected)
    → Flash Sale discount (PERCENTAGE or FIXED)
      → Bundle discount (additional % off)
        → Coupon discount (at checkout)
          = Final price
```

### Key Functions
- `applyDiscount(price, type, value)` — Pure flash sale math (`src/lib/flashSalePrice.ts`)
- `getEffectivePrice(productPrice, variantPrice, flashSale)` — Chooses correct price
- `getCartItemPrice(item)` — Reads stored price from cart item

### Cart Price Storage
- **Logged-in:** `addToCart()` computes flash sale price server-side, stores in `CartItem.price`
- **Guest:** Client computes price using `applyDiscount()`, stores in localStorage
- **Checkout:** Uses stored `CartItem.price` — snapshot of price at add time

---

## Server Actions

### Auth Helpers (`src/lib/authHelpers.ts`)
Centralized — used across all action files:
- `requireUser()` → userId
- `requireAdmin()` → userId
- `requireApprovedVendor()` → vendor object
- `requireVendorOwnership(productId)` → vendor object

### Key Actions
| File | Functions |
|------|-----------|
| `cart.ts` | addToCart, removeFromCart, updateCartQuantity, getCart |
| `orders/create.ts` | createOrder, createGuestOrder |
| `products.ts` | createProduct, updateProduct, addProductImage, deleteProduct |
| `variants.ts` | addVariant, updateVariant, deleteVariant, saveVariants |
| `bundles.ts` | getBundleItems, addBundleItem, removeBundleItem, searchVendorProducts |
| `flashSales.ts` | createFlashSale, getFlashSaleByProduct, getFlashSalesForProducts |
| `coupons.ts` | validateCoupon, createCoupon, toggleCoupon |
| `banners.ts` | getBanners, createBanner, updateBanner, deleteBanner |
| `reviews.ts` | createReview |
| `messages.ts` | getOrCreateConversation, sendMessage |
| `returns.ts` | createReturnRequest, vendorProcessReturn |
| `commission.ts` | getCommissionRate, setGlobalCommission |
| `withdrawal.ts` | requestWithdrawal, adminProcessWithdrawal |

---

## i18n (Localization)

**Languages:** Georgian (ka), English (en)

**Message namespaces:**
- `Nav` — Navigation (categories, vendors, signIn, shop, wishlist, orders, etc.)
- `Home` — Homepage (heroTitle, searchPlaceholder, popularSearches, etc.)
- `Product` — Product page (addToCart, inStock, reviews, bundleTitle, etc.)
- `Cart` — Cart drawer (bag, subtotal, checkout, freeShipping, etc.)
- `Auth` — Login/register (email, password, loginError, etc.)

**Helper:** `localized(locale, kaText, enText)` — picks text by active locale

---

## Image Optimization

- **Cloudinary:** `f_auto,q_auto` applied everywhere via `optimizeImageUrl(url, width)`
- **Next.js Image:** AVIF/WebP formats, 30-day cache TTL
- **Sizes:** Thumbnails 64-80px, cards 200-400px, gallery 800px, lightbox 1200px

---

## UX Features

### Cart Drawer
- Slide-out from right, two tabs: Shopping Bag + Recently Viewed
- Free shipping progress bar (₾100 threshold)
- Auto-opens on Add to Cart from anywhere

### Search
- Glow effect on focus, backdrop overlay
- Empty state: recent searches + popular searches (chips)
- Typing: category chips + product suggestions + "Search for X"
- Debounced 300ms, keyboard navigation

### Auth Modal
- Popup login/register (no page navigation)
- Switches between tabs, localized errors

### Mobile
- Slide-in drawer menu with user info, nav links, categories accordion
- Sticky bottom bar with price + Add to Cart
- Banner carousel + side banners

### Navigation
- Blue progress bar on page transitions
- Auto scroll-to-top on route change
- Page-specific loading skeletons

---

## Test Accounts (Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@automarket.ge | admin123 |
| Buyer | buyer@automarket.ge | buyer123 |
| Vendor | info@tbilisiauto.ge | vendor123 |
| Vendor | info@kavkasiamotors.ge | vendor123 |
| Vendor | info@autoworld.ge | vendor123 |

---

## Environment Variables

```
DATABASE_URL=             # Neon PostgreSQL connection string
NEXTAUTH_SECRET=          # JWT signing secret
NEXTAUTH_URL=             # App URL (auto on Vercel)
CLOUDINARY_CLOUD_NAME=    # Cloudinary cloud name
CLOUDINARY_API_KEY=       # Cloudinary API key
CLOUDINARY_API_SECRET=    # Cloudinary API secret
CRON_SECRET=              # Cron endpoint auth secret
```

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npx prisma db push   # Push schema to DB
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed test data
npm test             # Run tests
```
