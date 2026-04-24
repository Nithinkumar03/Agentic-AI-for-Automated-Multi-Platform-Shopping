"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "Could not add to cart");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-region="add-to-cart-form">
      <div className="flex items-center gap-3">
        <label htmlFor={`qty-${productId}`} className="text-sm font-medium text-zinc-700">
          Quantity
        </label>
        <input
          id={`qty-${productId}`}
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          data-input="cart-quantity"
          aria-label="Quantity to add"
        />
      </div>
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="rounded-xl bg-emerald-700 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        data-action="add-to-cart"
        data-product-id={productId}
        aria-label={`Add ${qty} of ${productId} to cart`}
      >
        {busy ? "Adding…" : "Add to cart"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert" data-cart-error="true">
          {error}
        </p>
      ) : null}
    </div>
  );
}
