import { getProductById } from "@/lib/products";
import type { CartItemResponse, CartLine, CartResponse } from "@/lib/types";

export function buildCartResponse(lines: CartLine[]): CartResponse {
  const items: CartItemResponse[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const line of lines) {
    const product = getProductById(line.productId);
    if (!product) continue;
    const lineTotal = product.price * line.quantity;
    subtotal += lineTotal;
    itemCount += line.quantity;
    items.push({
      cartItemId: line.cartItemId,
      productId: line.productId,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      quantity: line.quantity,
      image: product.image,
      lineTotal,
      unit: product.unit,
    });
  }

  return { items, subtotal, itemCount };
}
