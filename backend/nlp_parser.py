from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable


@dataclass
class ParsedItem:
    item: str
    qty: int


_MODEL = None


def _get_nlp():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    try:
        import spacy

        _MODEL = spacy.load("en_core_web_sm")
    except Exception:
        _MODEL = None
    return _MODEL


_QTY_PATTERNS = [
    re.compile(r"(?P<qty>\d+)\s*(x|×)\s*(?P<item>.+)", re.I),
    re.compile(r"(?P<qty>\d+)\s+(?P<item>.+)", re.I),
    re.compile(r"(?P<item>.+?)\s*(x|×)\s*(?P<qty>\d+)", re.I),
]


def _split_phrases(text: str) -> list[str]:
    cleaned = re.sub(r"[;|]+", ",", text)
    cleaned = cleaned.replace(" and ", ", ")
    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    return parts if parts else [text.strip()]


def _clean_item_name(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"\b(pack(et)?s?|kg|g|gm|grams?|ml|l|lit(er|re)s?)\b", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _parse_phrase(phrase: str) -> ParsedItem | None:
    for pat in _QTY_PATTERNS:
        m = pat.match(phrase.strip())
        if not m:
            continue
        qty = int(m.group("qty"))
        item = _clean_item_name(m.group("item"))
        return ParsedItem(item=item, qty=max(1, qty))

    return ParsedItem(item=_clean_item_name(phrase), qty=1)


def _dedupe(items: Iterable[ParsedItem]) -> list[ParsedItem]:
    merged: dict[str, ParsedItem] = {}
    for it in items:
        if not it.item:
            continue
        if it.item in merged:
            merged[it.item].qty += it.qty
        else:
            merged[it.item] = ParsedItem(item=it.item, qty=it.qty)
    return list(merged.values())


def parse_grocery_list(text: str) -> list[dict[str, int | str]]:
    text = (text or "").strip()
    if not text:
        return []

    phrases = _split_phrases(text)
    raw = [_parse_phrase(p) for p in phrases if p.strip()]
    items = [r for r in raw if r is not None and r.item]

    # Use spaCy to refine the noun phrase when available.
    nlp = _get_nlp()
    if nlp:
        refined: list[ParsedItem] = []
        for it in items:
            doc = nlp(it.item)
            noun_chunks = [c.text for c in doc.noun_chunks]
            if noun_chunks:
                refined.append(ParsedItem(item=_clean_item_name(noun_chunks[0]), qty=it.qty))
            else:
                refined.append(it)
        items = refined

    merged = _dedupe(items)
    return [{"item": it.item, "qty": it.qty} for it in merged]
