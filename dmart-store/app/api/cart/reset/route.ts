import { NextResponse } from "next/server";
import { readCartLines, writeCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";

/**
 * Clear all lines from the cart (for agents / demos). POST, no body.
 */
export async function POST() {
  const before = buildCartResponse(await readCartLines());
  await writeCartLines([]);
  const after = buildCartResponse(await readCartLines());
  return NextResponse.json({
    cleared: before.items.length,
    previousSubtotal: before.subtotal,
    cart: after,
  });
}
