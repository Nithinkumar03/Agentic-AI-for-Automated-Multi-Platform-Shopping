# DMart Store — code structure reference

This document describes the **dmart-store** Next.js 15 (App Router) demo: a grocery catalog with REST APIs and a cookie-backed cart, optimized for **agentic** clients (HTTP APIs + stable `data-*` hooks in HTML).

Maintainers often use **Cursor with Composer 1.5** on this repo; treat this file as the map before refactors or new features.

---

## Top-level layout

```
dmart-store/
├── app/                    # App Router: pages, layouts, API routes
├── components/             # React components (server + client)
├── data/
│   └── catalog.ts          # Product catalog (authoritative list)
├── lib/                    # Pure/domain helpers (no JSX)
├── scripts/
│   └── build-products.mjs  # Optional: regenerate JSON (legacy helper)
├── .cursor/skills/         # Cursor skills for this project
├── next.config.ts          # e.g. remote image patterns (placehold.co)
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── eslint.config.mjs
```

---

## Data model

### `lib/types.ts`

- **`Product`**: `id`, `name`, `category`, `price`, `mrp`, `discount`, `unit`, `inStock`, `description`
- **`ProductWithImage`**: `Product` + `image` (absolute HTTPS URL at runtime)
- **`CartLine`**: `cartItemId` (UUID), `productId`, `quantity`
- **`CartItemResponse` / `CartResponse`**: enriched cart for JSON APIs and UI

### `data/catalog.ts`

- Exports **`catalog`**: `Product[]` (72 products, 7 categories)
- Helper **`p(...)`** builds a row with `inStock: true`
- **Edit here** to add/remove products or change categories; IDs should stay URL-safe slugs (e.g. `7-up`, `fortune-refined-sunflower-oil`)

### `lib/placehold.ts`

- **`productImageUrl(name)`** returns a **placehold.co** PNG URL (green tile + product label)
- Wired in **`lib/products.ts`** so every `ProductWithImage` has a stable `image` field

### `lib/products.ts`

- **`getAllProducts()`**, **`getProductById(id)`**, **`getProductsByCategory(category)`**, **`getCategories()`**
- Category filter uses **exact** `category` string match (must match `catalog` values)

---

## Cart persistence

### `lib/cart-cookie.ts`

- Cookie name: **`dmart_cart`**
- Value: JSON array of **`CartLine`**
- **httpOnly**, **sameSite: lax**, 30-day **maxAge**
- Uses `next/headers` **`cookies()`** (async in Route Handlers and Server Components)

### `lib/cart-response.ts`

- **`buildCartResponse(lines)`**: drops lines whose `productId` no longer exists; computes **`lineTotal`**, **`subtotal`**, **`itemCount`**

**Note:** In-memory server state is **not** used; cart survives reloads via the cookie.

---

## HTTP API (agent-first)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/products` | All products; optional `?category=` (URL-encoded category name) |
| `GET` | `/api/products/[id]` | Single product; 404 if unknown `id` |
| `GET` | `/api/cart` | Current cart (`items`, `subtotal`, `itemCount`) |
| `POST` | `/api/cart` | Body: `{ productId, quantity? }` — merges qty if same `productId` |
| `PUT` | `/api/cart` | Body: `{ cartItemId, quantity }` |
| `DELETE` | `/api/cart/[id]` | `id` = `cartItemId` |

Implementation files:

- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/cart/route.ts`
- `app/api/cart/[id]/route.ts`

---

## App Router pages

| Route | File | Notes |
| --- | --- | --- |
| `/` | `app/page.tsx` | Hero + featured grid |
| `/products` | `app/products/page.tsx` | Category filter via **`searchParams.category`** |
| `/products/[id]` | `app/products/[id]/page.tsx` | JSON-LD + **`AddToCartForm`** |
| `/products/[id]` (404) | `app/products/[id]/not-found.tsx` | Unknown slug |
| `/cart` | `app/cart/page.tsx` | Server-read cookie → **`CartItems`** |

**`app/layout.tsx`**: wraps all pages with **`Navbar`** + `<main>`.

**`app/globals.css`**: Tailwind v4 entry (`@import "tailwindcss"`).

---

## Components

| Component | Client? | Role |
| --- | --- | --- |
| `Navbar.tsx` | Server | Reads cart cookie; shows **badge** `data-cart-badge="item-count"` |
| `CategoryFilter.tsx` | Server | Sidebar links `data-category-filter` |
| `ProductCard.tsx` | Server | Grid card; **`data-product-*`**; image + **`AddToCartInline`** |
| `AddToCartInline.tsx` | Client | `POST /api/cart` qty 1; **`data-action="add-to-cart"`** |
| `AddToCartForm.tsx` | Client | Detail page qty input + **`data-input="cart-quantity"`** |
| `CartItems.tsx` | Client | List, **blur**-commit qty, remove; **`data-cart-*`** |

After mutations, client components call **`router.refresh()`** so server-rendered shell (e.g. navbar count) updates.

---

## Configuration

- **`next.config.ts`**: `images.remotePatterns` for **placehold.co**
- **`next-env.d.ts`**: Next.js TypeScript refs
- **`eslint.config.mjs`**: Next core-web-vitals + TypeScript (FlatCompat)

---

## Extending the project

1. **New products**: append to **`data/catalog.ts`**; keep unique `id` slugs.
2. **Real product images**: add optional `imageUrl` on `Product`, prefer it in **`lib/products.ts`** over `productImageUrl()`, and widen **`next.config.ts`** `remotePatterns` if remote.
3. **Persistence**: replace cookie store with DB/Redis; keep **`CartLine`** / **`CartResponse`** shapes so APIs stay stable for agents.
4. **Auth**: add middleware/session; cart cookie may need to be scoped to user server-side.

---

## Related skill

The Cursor skill **`dmart-store-code-structure`** ([SKILL.md](SKILL.md)) points agents here for full detail.
