from __future__ import annotations

import base64
import json
import re
from typing import Any

from groq import Groq

from config import GROQ_API_KEY, GROQ_MODEL, GROQ_VISION_MODEL


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


def _parse_jsonish(content: str) -> Any:
    text = (content or "").strip()
    if not text:
        return None
    if "```" in text:
        m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.I)
        if m:
            text = m.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def extract_list_from_image(image_bytes: bytes, mime: str = "image/jpeg") -> list[dict[str, Any]]:
    """
    Use Groq vision to read a photo of a handwritten or printed grocery list.
    Returns a list of dicts: {"item": str, "qty": int}.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is missing. Set it in .env.")
    if len(image_bytes) > 3_500_000:  # keep base64 under ~4.7MB raw cap for data URLs
        raise ValueError("Image too large; use under ~3.5MB.")

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    system = (
        "You read shopping lists from images. Return ONLY valid JSON, no markdown. "
        "Schema: {\"items\":[{\"item\":string,\"qty\":number}]}. "
        "Item names: plain English (or Hinglish words romanized). "
        "Use integers for qty, minimum 1. If a quantity is missing, use 1. "
        "Ignore non-item lines like store headers or 'total'."
    )
    user_text = "Extract all grocery or household items and quantities from this list image."
    client = _client()
    resp = client.chat.completions.create(
        model=GROQ_VISION_MODEL,
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        temperature=0.1,
    )
    content = (resp.choices[0].message.content or "").strip()
    data = _parse_jsonish(content)
    if data is None:
        return []
    if isinstance(data, list):
        raw_items = data
    elif isinstance(data, dict):
        raw_items = data.get("items", [])
    else:
        return []

    out: list[dict[str, Any]] = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("item", entry.get("name", ""))).strip()
        if not name:
            continue
        try:
            qty = int(entry.get("qty", entry.get("quantity", 1)))
        except (TypeError, ValueError):
            qty = 1
        qty = max(1, min(99, qty))
        out.append({"item": name.lower(), "qty": qty})
    return out


def parse_speech_text(transcript: str) -> list[dict[str, Any]]:
    """Use the LLM to extract grocery items + quantities from a speech transcript."""
    system = (
        "Extract grocery or household items and quantities from the user's speech transcript. "
        "The transcript may be in English, Hindi, Hinglish, or mixed language. "
        "Return ONLY valid JSON, no markdown. "
        'Schema: {"items":[{"item":string,"qty":number}]}. '
        "Item names: plain English (or romanized Hinglish). "
        "Use integers for qty, minimum 1. If a quantity is missing, use 1. "
        "Ignore filler words like 'I want', 'please', 'mujhe chahiye', 'add', etc."
    )
    result = _call_json(system, transcript, {"items": []})
    raw_items: list[Any] = []
    if isinstance(result, dict):
        raw_items = result.get("items", [])
    elif isinstance(result, list):
        raw_items = result

    out: list[dict[str, Any]] = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("item", entry.get("name", ""))).strip()
        if not name:
            continue
        try:
            qty = int(entry.get("qty", entry.get("quantity", 1)))
        except (TypeError, ValueError):
            qty = 1
        qty = max(1, min(99, qty))
        out.append({"item": name.lower(), "qty": qty})
    return out


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
