import Image from "next/image";
import Link from "next/link";
import type { ProductWithImage } from "@/lib/types";
import { AddToCartInline } from "@/components/AddToCartInline";

export function ProductCard({ product }: { product: ProductWithImage }) {
  return (
    <article
      className="product-card flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
      data-product-id={product.id}
      data-product-name={product.name}
      data-product-category={product.category}
      data-product-price={product.price}
      data-product-mrp={product.mrp}
      data-product-unit={product.unit}
      data-in-stock={product.inStock ? "true" : "false"}
    >
      <Link
        href={`/products/${encodeURIComponent(product.id)}`}
        className="block"
        data-product-detail-link={product.id}
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square w-full bg-zinc-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${encodeURIComponent(product.id)}`} className="line-clamp-2 font-medium text-zinc-900">
          {product.name}
        </Link>
        <p className="text-xs text-zinc-500">{product.unit}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="product-price text-lg font-semibold text-emerald-800" data-price-display="inr">
              ₹{product.price}
            </p>
            <p className="text-xs text-zinc-400 line-through">₹{product.mrp}</p>
          </div>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {product.discount} off
          </span>
        </div>
        <AddToCartInline productId={product.id} />
      </div>
    </article>
  );
}
