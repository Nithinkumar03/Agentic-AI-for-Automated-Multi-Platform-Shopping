from __future__ import annotations

import json
from typing import Any

from bs4 import BeautifulSoup


def parse_cart_page(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for row in soup.select("[data-cart-item-id]"):
        item = {
            "cartItemId": row.get("data-cart-item-id"),
            "productId": row.get("data-product-id"),
            "quantity": int(row.get("data-line-quantity") or 0),
            "lineTotal": float(row.get("data-line-total") or 0),
            "name": (row.select_one("[data-cart-product-name]") or {}).get("text", ""),
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

    return {"items": items, "subtotal": subtotal, "itemCount": len(items), "orderId": order_id}


def parse_product_page(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    ld = soup.select_one("script[type='application/ld+json']")
    if ld and ld.text.strip():
        try:
            return json.loads(ld.text.strip())
        except json.JSONDecodeError:
            pass
    return {}
