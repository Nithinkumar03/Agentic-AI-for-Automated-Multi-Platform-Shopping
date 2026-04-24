import { cookies } from "next/headers";
import type { CartLine } from "@/lib/types";

const COOKIE_NAME = "dmart_cart";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function isCartLine(x: unknown): x is CartLine {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.cartItemId === "string" &&
    typeof o.productId === "string" &&
    typeof o.quantity === "number" &&
    Number.isFinite(o.quantity) &&
    o.quantity >= 1
  );
}

export async function readCartLines(): Promise<CartLine[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartLine);
  } catch {
    return [];
  }
}

export async function writeCartLines(lines: CartLine[]): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}
