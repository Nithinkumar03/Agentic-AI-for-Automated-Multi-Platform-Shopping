import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readCartLines, writeCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";
import { getProductById } from "@/lib/products";

export async function GET() {
  const lines = await readCartLines();
  return NextResponse.json(buildCartResponse(lines));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Expected object body" }, { status: 400 });
  }
  const { productId, quantity } = body as { productId?: unknown; quantity?: unknown };
  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  const qty = typeof quantity === "number" ? quantity : 1;
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
    return NextResponse.json({ error: "quantity must be 1–99" }, { status: 400 });
  }
  const product = getProductById(productId);
  if (!product || !product.inStock) {
    return NextResponse.json({ error: "Product not available" }, { status: 404 });
  }

  const lines = await readCartLines();
  const existing = lines.find((l) => l.productId === productId);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + Math.floor(qty));
  } else {
    lines.push({
      cartItemId: randomUUID(),
      productId,
      quantity: Math.floor(qty),
    });
  }
  await writeCartLines(lines);
  return NextResponse.json(buildCartResponse(lines));
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Expected object body" }, { status: 400 });
  }
  const { cartItemId, quantity } = body as { cartItemId?: unknown; quantity?: unknown };
  if (typeof cartItemId !== "string" || !cartItemId.trim()) {
    return NextResponse.json({ error: "cartItemId is required" }, { status: 400 });
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }
  const q = Math.floor(quantity);
  if (q < 1 || q > 99) {
    return NextResponse.json({ error: "quantity must be 1–99" }, { status: 400 });
  }
  const lines = await readCartLines();
  const line = lines.find((l) => l.cartItemId === cartItemId);
  if (!line) {
    return NextResponse.json({ error: "Cart line not found" }, { status: 404 });
  }
  line.quantity = q;
  await writeCartLines(lines);
  return NextResponse.json(buildCartResponse(lines));
}
