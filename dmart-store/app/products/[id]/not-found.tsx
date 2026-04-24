import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center" data-page="product-not-found">
      <h1 className="text-xl font-semibold text-zinc-900">Product not found</h1>
      <p className="mt-2 text-sm text-zinc-600">That product ID does not exist in this demo catalog.</p>
      <Link href="/products" className="mt-4 inline-block font-semibold text-emerald-800 underline">
        Back to products
      </Link>
    </div>
  );
}
