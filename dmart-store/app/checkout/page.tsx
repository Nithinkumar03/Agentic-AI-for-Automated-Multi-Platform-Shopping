"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutContent() {
  const sp = useSearchParams();
  const orderId = sp.get("orderId") ?? "";

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-emerald-200 bg-white p-8 shadow-sm" data-page="checkout">
      <h1 className="text-2xl font-bold text-emerald-950">Order confirmed</h1>
      <p className="text-zinc-700">
        Thank you. This is a demo checkout — no real payment was taken.
      </p>
      {orderId ? (
        <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900" data-checkout-order-id={orderId}>
          Order ID: {orderId}
        </p>
      ) : (
        <p className="text-sm text-amber-800">No order id in URL. Open this page after completing checkout from the cart.</p>
      )}
      <Link
        href="/products"
        className="inline-block rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        data-nav-link="post-checkout-products"
      >
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
