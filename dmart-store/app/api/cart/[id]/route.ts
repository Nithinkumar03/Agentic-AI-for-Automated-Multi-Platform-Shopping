import { NextResponse } from "next/server";
import { readCartLines, writeCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  const { id } = await context.params;
  const cartItemId = decodeURIComponent(id);
  const lines = await readCartLines();
  const next = lines.filter((l) => l.cartItemId !== cartItemId);
  if (next.length === lines.length) {
    return NextResponse.json({ error: "Cart line not found" }, { status: 404 });
  }
  await writeCartLines(next);
  return NextResponse.json(buildCartResponse(next));
}
