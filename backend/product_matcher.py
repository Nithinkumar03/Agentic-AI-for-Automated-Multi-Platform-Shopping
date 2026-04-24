from __future__ import annotations

from difflib import SequenceMatcher
from typing import Any

import requests

from config import DMART_BASE_URL


def _score(query: str, text: str) -> float:
    q = query.lower().strip()
    t = text.lower().strip()
    if not q or not t:
        return 0.0
    if q in t:
        return 0.95 + min(0.05, len(q) / max(len(t), 1) * 0.05)
    return SequenceMatcher(None, q, t).ratio()


def _fetch_catalog() -> list[dict[str, Any]]:
    url = f"{DMART_BASE_URL}/api/products"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    products = data.get("products", [])
    return [p for p in products if isinstance(p, dict)]


def get_catalog() -> list[dict[str, Any]]:
    return _fetch_catalog()


def get_categories(products: list[dict[str, Any]]) -> list[str]:
    categories = {str(p.get("category", "")).strip() for p in products if p.get("category")}
    return sorted(c for c in categories if c)


def _rank_item(item: str, products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scores: list[tuple[float, dict[str, Any]]] = []
    toks = [t for t in item.lower().split() if len(t) > 2]
    for p in products:
        name = str(p.get("name", ""))
        desc = str(p.get("description", ""))
        blob = f"{name} {desc}"
        score = max(_score(item, name), 0.85 * _score(item, desc), 0.6 * _score(item, blob))
        name_lower = name.lower()
        if toks and not any(t in name_lower for t in toks):
            score = min(score, 0.45)
        rating = float(p.get("rating", 3.5))
        combined = score * 0.90 + (rating / 5.0) * 0.10
        scores.append(
            (
                combined,
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "price": p.get("price"),
                    "unit": p.get("unit"),
                    "category": p.get("category"),
                    "rating": round(rating, 2),
                    "text_score": round(score, 3),
                    "score": round(combined, 3),
                },
            )
        )
    scores.sort(key=lambda x: x[0], reverse=True)
    return [s[1] for s in scores]


def match_items(items: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    products = _fetch_catalog()
    exact: list[dict[str, Any]] = []
    ambiguous: list[dict[str, Any]] = []
    not_found: list[dict[str, Any]] = []
    debug_ranking: list[dict[str, Any]] = []

    for item in items:
        query = str(item.get("item", "")).strip()
        qty = int(item.get("qty", 1) or 1)
        if not query:
            continue

        ranked = _rank_item(query, products)
        debug_ranking.append(
            {
                "item": query,
                "qty": qty,
                "top3": [
                    {
                        "id": r.get("id"),
                        "name": r.get("name"),
                        "score": r.get("score"),
                    }
                    for r in ranked[:3]
                ],
            }
        )
        if not ranked or ranked[0]["score"] < 0.25:
            not_found.append({"item": query, "qty": qty})
            continue

        top = ranked[0]
        second = ranked[1] if len(ranked) > 1 else None
        is_ambiguous = (
            second is not None and second["score"] >= 0.55 and (top["score"] - second["score"]) < 0.08
        )

        if is_ambiguous:
            ambiguous.append(
                {
                    "item": query,
                    "qty": qty,
                    "candidates": ranked[:5],
                }
            )
        else:
            prod = {k: top[k] for k in ("id", "name", "price", "unit", "category")}
            if "rating" in top:
                prod["rating"] = top["rating"]
            exact.append(
                {
                    "item": query,
                    "qty": qty,
                    "product": prod,
                }
            )

    return {
        "exact": exact,
        "ambiguous": ambiguous,
        "not_found": not_found,
        "debug_ranking": debug_ranking,
    }
