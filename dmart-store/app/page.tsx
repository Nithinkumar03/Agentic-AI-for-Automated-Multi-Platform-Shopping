import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getAllProducts } from "@/lib/products";

export default function HomePage() {
  const products = getAllProducts();
  const featured = products.slice(0, 8);

  return (
    <div className="space-y-10" data-page="home">
      <section
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 px-6 py-10 text-white shadow-lg"
        data-region="hero"
      >
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">DMart Store (demo)</h1>
        <p className="mt-3 max-w-2xl text-emerald-100">
          Agent-friendly catalog: semantic HTML, stable product IDs, and JSON APIs for{" "}
          <code className="rounded bg-white/10 px-1">/api/products</code> and{" "}
          <code className="rounded bg-white/10 px-1">/api/cart</code>.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow hover:bg-emerald-50"
          data-action="browse-all-products"
        >
          Browse all products
        </Link>
      </section>

      <section data-region="featured-products">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900">Featured products</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
