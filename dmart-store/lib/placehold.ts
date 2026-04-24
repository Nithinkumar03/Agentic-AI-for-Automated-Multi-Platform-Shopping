/** Web-hosted placeholder image (placehold.co) — deterministic label for agents and humans. */
export function productImageUrl(productName: string): string {
  const label = productName.length > 28 ? `${productName.slice(0, 25)}…` : productName;
  return `https://placehold.co/400x400/047857/ffffff/png?text=${encodeURIComponent(label)}`;
}
