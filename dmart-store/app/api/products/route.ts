import { NextResponse } from "next/server";
import { getAllProducts, getProductsByCategory } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "";
  const products = category ? getProductsByCategory(category) : getAllProducts();
  return NextResponse.json({ count: products.length, products });
}
