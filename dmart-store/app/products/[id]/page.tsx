import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/AddToCartForm";
import { getProductById, getAllProducts } from "@/lib/products";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(decodeURIComponent(id));
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — DMart Store`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(decodeURIComponent(id));
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="space-y-6" data-page="product-detail" data-product-id={product.id}>
      <nav className="text-sm text-zinc-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/products" className="hover:text-emerald-800">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-emerald-800"
              data-breadcrumb-category={product.category}
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-800">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900" data-product-name={product.id}>
            {product.name}
          </h1>
          <p className="text-sm text-zinc-500">{product.unit}</p>
          <div className="flex flex-wrap items-end gap-3">
            <p className="product-price text-3xl font-bold text-emerald-800" data-price-display="inr">
              ₹{product.price}
            </p>
            <p className="text-lg text-zinc-400 line-through">₹{product.mrp}</p>
            <span className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">
              {product.discount} off
            </span>
          </div>
          <p className="text-zinc-700">{product.description}</p>
          <AddToCartForm productId={product.id} />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
