"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartInline({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
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
    <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={add}
      disabled={busy}
      className="w-full rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      data-action="add-to-cart"
      data-product-id={productId}
      aria-label={`Add product ${productId} to cart`}
    >
      {busy ? "Adding…" : "Add to cart"}
    </button>
    {error ? (
      <p className="text-xs text-red-600" role="alert" data-cart-error="true">
        {error}
      </p>
    ) : null}
    </div>
  );
}
