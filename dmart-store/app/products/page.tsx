import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { getAllProducts, getProductsByCategory } from "@/lib/products";

type Props = { searchParams: Promise<{ category?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.category?.trim() ?? "";
  const products = category ? getProductsByCategory(category) : getAllProducts();

  return (
    <div className="space-y-6" data-page="products">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {products.length} items
          {category ? (
            <>
              {" "}
              in <span data-active-category={category}>{category}</span>
            </>
          ) : null}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <CategoryFilter active={category || undefined} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
