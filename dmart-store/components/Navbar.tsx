import Link from "next/link";
import { readCartLines } from "@/lib/cart-cookie";
import { buildCartResponse } from "@/lib/cart-response";

export async function Navbar() {
  const lines = await readCartLines();
  const { itemCount } = buildCartResponse(lines);

  return (
    <header
      className="sticky top-0 z-20 border-b border-emerald-900/10 bg-emerald-800 text-white shadow-sm"
      data-region="site-header"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
          data-nav-link="home"
          aria-label="DMart Store home"
        >
          DMart Store
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Primary">
          <Link
            href="/products"
            className="rounded px-2 py-1 hover:bg-white/10"
            data-nav-link="products"
          >
            Products
          </Link>
          <Link
            href="/cart"
            className="relative rounded px-2 py-1 hover:bg-white/10"
            data-nav-link="cart"
            aria-label={`Cart, ${itemCount} items`}
          >
            Cart
            {itemCount > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-emerald-950"
                data-cart-badge="item-count"
              >
                {itemCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
