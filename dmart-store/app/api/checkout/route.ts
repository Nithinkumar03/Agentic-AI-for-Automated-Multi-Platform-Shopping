import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readCartLines, writeCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";

/**
 * Place a one-shot demo order: captures cart, clears cookie, returns order id.
 * POST (no body). Empty cart -> 400.
 */
export async function POST() {
  const lines = await readCartLines();
  if (lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  const cart = buildCartResponse(lines);
  const orderId = `DM-${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const snapshot = {
    orderId,
    items: cart.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: cart.subtotal,
    itemCount: cart.itemCount,
  };
  await writeCartLines([]);
  return NextResponse.json({ ...snapshot, message: "Order placed (demo). Cart cleared." });
}
