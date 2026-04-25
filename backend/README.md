# DMart agentic shopper (hackathon backend)

Flask + Selenium + spaCy + Groq for a deterministic shopping pipeline with AI used only for reasoning.

## Prerequisites

- Python 3.11+
- Node.js (for the Next.js store)
- [Groq API key](https://console.groq.com/)

## Setup

```bash
cd backend
py -3 -m venv .venv
# Windows venv: activation lives in .venv/Scripts (not .venv/bin).
# — Git Bash (MINGW64) — use forward slashes and `source` (backslashes are wrong):
#   source .venv/Scripts/activate
#   # or: source ./activate-venv-bash.sh
# — cmd.exe:
#   .venv\Scripts\activate.bat
# — PowerShell:
#   .\.venv\Scripts\Activate.ps1
# DO NOT `cd c:\Users\...` in Git Bash; use `cd /c/Users/...` or a quoted path.
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# Edit .env and set GROQ_API_KEY
```

## Run

Terminal 1 — store:

```bash
cd ../dmart-store
npm run dev
```

Terminal 2 — Flask app:

```bash
cd backend
source .venv/Scripts/activate
python app.py
```

Or **without** activating the venv (any shell, Windows):

```bash
cd backend
.venv/Scripts/python app.py
```

Open **`http://127.0.0.1:5001/`** (Flask). Port **8501** is Streamlit’s default; if you run Flask on 8501, leftover Streamlit tabs call `/_stcore/stream` and get 404 with no UI. Override with `FLASK_PORT` if needed. Ensure `DMART_BASE_URL` matches the store (default `http://127.0.0.1:3000`).

## Photo shopping list (Groq vision)

- Set `GROQ_VISION_MODEL` in `.env` if needed (default: `meta-llama/llama-4-scout-17b-16e-instruct` in `config.py`).
- In the web UI, choose or capture a list image, then **Scan list**. Items are sent to `POST /api/scan-list` and the rows are filled from the model output.

## Demo prompts

- `Add milk, atta, rice, and sunflower oil. Then checkout.`
- `Add 2 Amul milk and one cooking oil, show cart, then place the order.`

## Troubleshooting

- **Connection refused**: start `npm run dev` in `dmart-store` first.
- **Selenium timeout**: confirm the product id exists (use **Products** in the store UI).
- **Headless vs headed**: set `SELENIUM_HEADLESS=0` in `.env` for a visible browser.
- **`GET /_stcore/stream` 404**: you are on port **8501** with a **Streamlit** client; use **`http://127.0.0.1:5001/`** for this Flask app (or stop Streamlit and use a fresh browser tab).

## Layout

| File | Role |
|------|------|
| `app.py` | Flask chat UI + orchestration |
| `nlp_parser.py` | spaCy list parsing |
| `product_matcher.py` | Catalog fetch + fuzzy match |
| `llm_brain.py` | Groq disambiguation + summary + **vision** (`extract_list_from_image` for list photos) |
| `browser_agent.py` | Selenium add-to-cart, view cart, checkout |
| `scraper.py` | BeautifulSoup cart parsing |

`dmart-store` exposes the checkout API and a `/checkout` confirmation page. The agent calls the `complete_checkout` tool, which clicks **Checkout** on the cart page in the same browser session.
