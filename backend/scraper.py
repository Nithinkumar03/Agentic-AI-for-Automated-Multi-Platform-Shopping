from __future__ import annotations

import json
from typing import Any

from bs4 import BeautifulSoup


def parse_cart_page(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    total_mrp = 0.0
    for row in soup.select("[data-cart-item-id]"):
        qty = int(row.get("data-line-quantity") or 0)
        mrp = 0.0
        mrp_attr = row.get("data-product-mrp")
        if mrp_attr:
            try:
                mrp = float(mrp_attr)
            except ValueError:
                mrp = 0.0
        line_mrp = mrp * max(qty, 0)
        total_mrp += line_mrp
        name_el = row.select_one("[data-cart-product-name]")
        name_text = name_el.get_text(strip=True) if name_el else ""
        item = {
            "cartItemId": row.get("data-cart-item-id"),
            "productId": row.get("data-product-id"),
            "quantity": qty,
            "lineTotal": float(row.get("data-line-total") or 0),
            "name": name_text,
            "mrp": mrp,
            "lineMrp": line_mrp,
        }
        items.append(item)

    subtotal_el = soup.select_one("[data-cart-subtotal]")
    subtotal = 0.0
    if subtotal_el:
        try:
            subtotal = float(subtotal_el.text.replace("₹", "").strip())
        except ValueError:
            subtotal = 0.0

    order_el = soup.select_one("[data-checkout-order-id]")
    order_id = order_el.get("data-checkout-order-id") if order_el else ""

    savings = max(0.0, total_mrp - subtotal) if total_mrp else 0.0
    avg_pct = 0.0
    if total_mrp > 0 and savings > 0:
        avg_pct = round(100.0 * savings / total_mrp, 1)

    return {
        "items": items,
        "subtotal": subtotal,
        "itemCount": len(items),
        "orderId": order_id,
        "totalMrp": total_mrp,
        "savings": savings,
        "savingsPercent": avg_pct,
    }


def parse_product_page(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    ld = soup.select_one("script[type='application/ld+json']")
    if ld and ld.text.strip():
        try:
            return json.loads(ld.text.strip())
        except json.JSONDecodeError:
            pass
    return {}
