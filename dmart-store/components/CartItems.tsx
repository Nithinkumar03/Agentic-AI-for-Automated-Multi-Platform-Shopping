"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CartResponse } from "@/lib/types";

export function CartItems({ initial }: { initial: CartResponse }) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    setCart(initial);
  }, [initial]);

  async function updateQty(cartItemId: string, quantity: number) {
    setBusyId(cartItemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      if (!res.ok) return;
      const next = (await res.json()) as CartResponse;
      setCart(next);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function checkout() {
    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const j = (await res.json().catch(() => null)) as { orderId?: string; error?: string } | null;
      if (!res.ok) {
        alert(j?.error ?? "Checkout failed");
        return;
      }
      if (j?.orderId) {
        router.push(`/checkout?orderId=${encodeURIComponent(j.orderId)}`);
        return;
      }
      router.push("/checkout");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function removeLine(cartItemId: string) {
    setBusyId(cartItemId);
    try {
      const res = await fetch(`/api/cart/${encodeURIComponent(cartItemId)}`, { method: "DELETE" });
      if (!res.ok) return;
      const next = (await res.json()) as CartResponse;
      setCart(next);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center"
        data-cart-empty="true"
      >
        <p className="text-zinc-600">Your cart is empty.</p>
        <Link href="/products" className="mt-3 inline-block font-semibold text-emerald-800 underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-region="cart-lines">
      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.cartItemId}
            className="cart-item flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
            data-cart-item-id={item.cartItemId}
            data-product-id={item.productId}
            data-line-quantity={item.quantity}
            data-line-total={item.lineTotal}
            data-product-mrp={item.mrp}
          >
            <div className="flex flex-1 gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
              </div>
              <div>
                <Link
                  href={`/products/${encodeURIComponent(item.productId)}`}
                  className="font-semibold text-zinc-900 hover:underline"
                  data-cart-product-name={item.productId}
                >
                  {item.name}
                </Link>
                <p className="text-xs text-zinc-500">{item.unit}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  ₹{item.price} <span className="text-zinc-400">×</span> {item.quantity}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <label className="sr-only" htmlFor={`cart-qty-${item.cartItemId}`}>
                Quantity for {item.name}
              </label>
              <input
                id={`cart-qty-${item.cartItemId}`}
                type="number"
                min={1}
                max={99}
                defaultValue={item.quantity}
                key={`${item.cartItemId}-${item.quantity}`}
                disabled={busyId === item.cartItemId}
                onBlur={(e) => {
                  const q = Math.max(1, Math.min(99, Number(e.target.value) || 1));
                  if (q !== item.quantity) void updateQty(item.cartItemId, q);
                }}
                className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                data-input="cart-line-quantity"
              />
              <p className="min-w-[4rem] text-right font-semibold text-emerald-900" data-line-total-display="inr">
                ₹{item.lineTotal}
              </p>
              <button
                type="button"
                className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={busyId === item.cartItemId}
                onClick={() => void removeLine(item.cartItemId)}
                data-action="remove-from-cart"
                aria-label={`Remove ${item.name} from cart`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div
        className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        data-cart-summary="true"
      >
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <span className="font-medium text-emerald-950">Subtotal</span>
          <span className="cart-total text-xl font-bold text-emerald-950" data-cart-subtotal="inr">
            ₹{cart.subtotal}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={checkoutBusy}
          className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          data-action="checkout"
          aria-label="Place order and go to confirmation"
        >
          {checkoutBusy ? "Placing order…" : "Checkout"}
        </button>
      </div>
    </div>
  );
}
