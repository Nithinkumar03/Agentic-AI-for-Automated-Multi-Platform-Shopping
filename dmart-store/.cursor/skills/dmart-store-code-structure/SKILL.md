---
name: dmart-store-code-structure
description: Explains the DMart Store demo Next.js app layout, data flow, cart cookie APIs, and agent-facing markup. Use when editing dmart-store, onboarding agents, debugging cart or catalog issues, or when the user works in Cursor with Composer 1.5 on this repository.
---

# DMart Store — code structure

## When to use this skill

- Changing catalog data, APIs, cart behavior, or UI in **`dmart-store`**
- Explaining the repo to another agent or developer
- Sessions in **Cursor with Composer 1.5**: read the reference first for full file-level detail

## Quick orientation

| Layer | Role |
| --- | --- |
| `data/catalog.ts` | Source of truth for all products (72 items, typed `Product[]`) |
| `lib/products.ts` | Read helpers; merges **image URLs** via `lib/placehold.ts` |
| `lib/cart-cookie.ts` | Serialize/parse cart lines in **httpOnly cookie** `dmart_cart` |
| `lib/cart-response.ts` | Turn cart lines + catalog into API/UI **CartResponse** |
| `app/api/*` | REST surface for agents (`/api/products`, `/api/cart`) |
| `app/**/page.tsx` | Server pages; client pieces in `components/*` |
| `components/*` | **`data-*` attributes** and `data-action` for scrapers/automation |

## Agent integration checklist

- Prefer **`GET /api/products`** and **`GET /api/cart`** over HTML scraping when possible
- DOM selectors: `[data-product-id]`, `[data-action="add-to-cart"]`, `[data-cart-subtotal="inr"]`
- Product detail pages emit **JSON-LD** `Product` in a `<script type="application/ld+json">`

## Full reference

For directory tree, request/response shapes, and extension points, see [CODE-STRUCTURE.md](CODE-STRUCTURE.md).
