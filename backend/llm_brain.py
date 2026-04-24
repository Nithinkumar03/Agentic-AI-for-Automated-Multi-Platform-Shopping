from __future__ import annotations

import json
from typing import Any

from groq import Groq

from config import GROQ_API_KEY, GROQ_MODEL


def _client() -> Groq:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is missing. Set it in .env.")
    return Groq(api_key=GROQ_API_KEY)


def _call_json(system: str, user: str, fallback: dict[str, Any]) -> dict[str, Any]:
    client = _client()
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    content = (resp.choices[0].message.content or "").strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return fallback


def disambiguate(item: str, candidates: list[dict[str, Any]]) -> dict[str, Any]:
    system = (
        "You select the best matching grocery product for a user intent. "
        "Return strict JSON with keys: id, name, reason. "
        "Only choose from the provided candidate list."
    )
    user = json.dumps({"item": item, "candidates": candidates}, ensure_ascii=False)
    fallback = {"id": candidates[0]["id"], "name": candidates[0]["name"], "reason": "best score"} if candidates else {}
    return _call_json(system, user, fallback)


def suggest_alternative(item: str, categories: list[str]) -> dict[str, Any]:
    system = (
        "Suggest a close alternative grocery item. "
        "Return strict JSON with keys: suggestion, category, reason."
    )
    user = json.dumps({"item": item, "categories": categories}, ensure_ascii=False)
    fallback = {"suggestion": item, "category": categories[0] if categories else "", "reason": "closest match"}
    return _call_json(system, user, fallback)


def summarize_cart(cart: dict[str, Any]) -> dict[str, Any]:
    system = (
        "Summarize the cart in one short paragraph. "
        "Return strict JSON with keys: summary, itemCount, subtotal."
    )
    user = json.dumps(cart, ensure_ascii=False)
    fallback = {
        "summary": "Cart ready.",
        "itemCount": cart.get("itemCount", 0),
        "subtotal": cart.get("subtotal", 0),
    }
    return _call_json(system, user, fallback)
