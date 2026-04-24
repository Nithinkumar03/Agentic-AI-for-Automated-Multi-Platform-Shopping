import type { Product } from "@/lib/types";

export function stockProductImageUrl(p: Product): string {
  // Deterministic, product-specific SVG served by the app (always matches the name).
  return `/product-images/${encodeURIComponent(p.id)}`;
}
