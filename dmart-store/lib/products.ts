import { catalog as raw } from "@/data/catalog";
import type { Product, ProductWithImage } from "@/lib/types";
import { stockProductImageUrl } from "@/lib/product-images";

function withImage(p: Product): ProductWithImage {
  return { ...p, image: stockProductImageUrl(p) };
}

export function getAllProducts(): ProductWithImage[] {
  return raw.map(withImage);
}

export function getProductById(id: string): ProductWithImage | undefined {
  const p = raw.find((x) => x.id === id);
  return p ? withImage(p) : undefined;
}

export function getProductsByCategory(category: string): ProductWithImage[] {
  if (!category) return getAllProducts();
  const c = decodeURIComponent(category).trim();
  return raw.filter((p) => p.category === c).map(withImage);
}

export function getCategories(): string[] {
  const set = new Set(raw.map((p) => p.category));
  return Array.from(set);
}
