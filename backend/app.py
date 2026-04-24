from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any

from flask import Flask, Response, jsonify, render_template, request, stream_with_context

from browser_agent import BrowserAgent
from config import SCREENSHOT_DIR
from llm_brain import disambiguate, summarize_cart, suggest_alternative
from nlp_parser import parse_grocery_list
from product_matcher import get_catalog, get_categories, match_items
from scraper import parse_cart_page

app = Flask(__name__)
browser = BrowserAgent()

# region agent log
_DBG_LOG = Path(__file__).resolve().parent.parent / "dmart-store" / "debug-49ae34.log"


def _dbg(hypothesis_id: str, message: str, data: dict[str, Any], run_id: str) -> None:
    try:
        _DBG_LOG.parent.mkdir(parents=True, exist_ok=True)
        line = {
            "sessionId": "49ae34",
            "timestamp": int(time.time() * 1000),
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": "app.py:process_shopping_request",
            "message": message,
            "data": data,
        }
        with open(_DBG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    except OSError:
        pass


# endregion


def _dbg_ui(hypothesis_id: str, message: str, data: dict[str, Any], run_id: str) -> None:
    # region agent log
    try:
        _DBG_LOG.parent.mkdir(parents=True, exist_ok=True)
        line = {
            "sessionId": "49ae34",
            "timestamp": int(time.time() * 1000),
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": "app.py:ui",
            "message": message,
            "data": data,
        }
        with open(_DBG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    except OSError:
        pass
    # endregion


def _as_static(path: str) -> str:
    p = Path(path)
    try:
        rel = p.relative_to(SCREENSHOT_DIR)
        return f"/static/screenshots/{rel.as_posix()}"
    except ValueError:
        return p.as_posix()


def _needs_checkout(text: str) -> bool:
    return bool(re.search(r"\b(checkout|place order|buy now|complete purchase)\b", text, re.I))


def stream_shopping_request(message: str):
    """Yield one dict per pipeline step, then a final ``{"done": True, "llm_usage": ...}``."""
    run_id = f"run-{int(time.time() * 1000)}"
    # region agent log
    _dbg("H1", "request_received", {"message": message}, run_id)
    # endregion
    items = parse_grocery_list(message)
    yield {"step": "parse", "items": items, "llm": False}
    # region agent log
    _dbg("H1", "parsed_items", {"items": items}, run_id)
    # endregion

    catalog = get_catalog()
    categories = get_categories(catalog)
    matches = match_items(items)
    yield {"step": "match", "results": matches, "llm": False}
    # region agent log
    _dbg(
        "H2",
        "match_results",
        {
            "exact": matches.get("exact", []),
            "ambiguous": matches.get("ambiguous", []),
            "not_found": matches.get("not_found", []),
            "debug_ranking": matches.get("debug_ranking", []),
        },
        run_id,
    )
    # endregion

    exact = list(matches["exact"])
    for amb in matches["ambiguous"]:
        # region agent log
        _dbg("H4", "llm_disambiguate_input", {"item": amb["item"], "candidates": amb["candidates"]}, run_id)
        # endregion
        pick = disambiguate(amb["item"], amb["candidates"])
        choice_id = pick.get("id")
        choice = next((c for c in amb["candidates"] if c.get("id") == choice_id), amb["candidates"][0])
        exact.append({"item": amb["item"], "qty": amb["qty"], "product": choice})
        # region agent log
        _dbg("H4", "llm_disambiguate_output", {"item": amb["item"], "pick": pick, "resolved": choice}, run_id)
        # endregion
        yield {
            "step": "disambiguate",
            "item": amb["item"],
            "picked": pick,
            "llm": True,
        }

    for missing in matches["not_found"]:
        suggestion = suggest_alternative(missing["item"], categories)
        # region agent log
        _dbg("H5", "llm_suggestion", {"missing": missing, "suggestion": suggestion}, run_id)
        # endregion
        yield {"step": "suggest", "item": missing["item"], "suggestion": suggestion, "llm": True}

    for entry in exact:
        product = entry["product"]
        # region agent log
        _dbg(
            "H3",
            "selected_for_add_to_cart",
            {"requested_item": entry["item"], "qty": entry["qty"], "product": product},
            run_id,
        )
        # endregion
        shot = browser.add_to_cart(product["id"], entry["qty"])
        yield {
            "step": "add_to_cart",
            "product": product,
            "qty": entry["qty"],
            "screenshot": _as_static(shot),
            "llm": False,
        }

    cart_view = browser.view_cart()
    cart_data = parse_cart_page(cart_view["html"])
    yield {
        "step": "view_cart",
        "cart": cart_data,
        "screenshot": _as_static(cart_view["screenshot"]),
        "llm": False,
    }

    if _needs_checkout(message):
        checkout_view = browser.checkout()
        checkout_data = parse_cart_page(checkout_view["html"])
        yield {
            "step": "checkout",
            "checkout": checkout_data,
            "screenshot": _as_static(checkout_view["screenshot"]),
            "llm": False,
        }

    summary = summarize_cart(cart_data)
    yield {"step": "summary", "summary": summary, "llm": True}

    llm_usage = {
        "used_for": ["disambiguation", "alternative_suggestions", "summary"],
        "not_used_for": ["parsing", "catalog search", "selenium actions", "html parsing"],
    }
    yield {"done": True, "llm_usage": llm_usage}


def process_shopping_request(message: str) -> dict[str, Any]:
    steps: list[dict[str, Any]] = []
    llm_usage: dict[str, Any] | None = None
    for ev in stream_shopping_request(message):
        if ev.get("done"):
            llm_usage = ev.get("llm_usage")
            break
        steps.append(ev)
    return {
        "steps": steps,
        "llm_usage": llm_usage
        or {
            "used_for": [],
            "not_used_for": [],
        },
    }


@app.route("/")
def index():
    # region agent log
    _dbg_ui(
        "H1",
        "index_get",
        {
            "path": request.path,
            "full_url": request.url,
            "remote_addr": request.remote_addr,
            "referer": request.headers.get("Referer"),
            "user_agent_preview": (request.headers.get("User-Agent") or "")[:160],
            "flask_root_path": app.root_path,
            "dbg_log_target": str(_DBG_LOG),
        },
        f"ui-{int(time.time() * 1000)}",
    )
    # endregion
    return render_template("index.html")


@app.route("/api/shop", methods=["POST"])
def api_shop():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    return jsonify(process_shopping_request(message))


@app.route("/api/shop/stream", methods=["GET"])
def api_shop_stream():
    message = request.args.get("message", "").strip()

    def generate():
        if not message:
            yield f"data: {json.dumps({'error': 'message is required'})}\n\n"
            return
        try:
            for ev in stream_shopping_request(message):
                yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:  # noqa: BLE001 — stream error to client
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/api/reset", methods=["POST"])
def api_reset():
    browser.close()
    return jsonify({"ok": True})


if __name__ == "__main__":
    # Default 5001 — Streamlit uses 8501; same port causes browsers/tabs to hit /_stcore/stream against Flask (404, no UI).
    _flask_port = int(os.environ.get("FLASK_PORT", "5001"))
    # region agent log
    _dbg_ui(
        "H2",
        "flask_main_start",
        {
            "port": _flask_port,
            "cwd": str(Path.cwd()),
            "app_file": str(Path(__file__).resolve()),
            "template_folder": app.template_folder,
            "dbg_log_target": str(_DBG_LOG),
        },
        "startup",
    )
    # endregion
    app.run(debug=True, port=_flask_port)
