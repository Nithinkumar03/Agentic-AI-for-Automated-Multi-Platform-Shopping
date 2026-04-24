import { readCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";
import { CartItems } from "@/components/CartItems";

export default async function CartPage() {
  const cart = buildCartResponse(await readCartLines());

  return (
    <div className="space-y-6" data-page="cart">
      <h1 className="text-2xl font-bold text-zinc-900">Cart</h1>
      <CartItems initial={cart} />
    </div>
  );
}
