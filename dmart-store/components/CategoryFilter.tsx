import Link from "next/link";
import { getCategories } from "@/lib/products";

export function CategoryFilter({ active }: { active?: string }) {
  const categories = getCategories();

  return (
    <nav
      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-sm"
      aria-label="Filter by category"
      data-region="category-filter"
    >
      <p className="mb-1 font-semibold text-zinc-700">Categories</p>
      <Link
        href="/products"
        className={`rounded px-2 py-1 hover:bg-zinc-100 ${!active ? "bg-emerald-50 font-semibold text-emerald-900" : ""}`}
        data-category-filter="all"
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/products?category=${encodeURIComponent(c)}`}
          className={`rounded px-2 py-1 hover:bg-zinc-100 ${active === c ? "bg-emerald-50 font-semibold text-emerald-900" : ""}`}
          data-category-filter={c}
        >
          {c}
        </Link>
      ))}
    </nav>
  );
}
