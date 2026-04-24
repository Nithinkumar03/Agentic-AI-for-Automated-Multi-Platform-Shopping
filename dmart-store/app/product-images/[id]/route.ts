import { NextResponse } from "next/server";
import { catalog } from "@/data/catalog";

type Ctx = { params: Promise<{ id: string }> };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function theme(category: string): { bg: string; fg: string; icon: string } {
  switch (category) {
    case "Cooking Oil":
      return { bg: "#064E3B", fg: "#ECFDF5", icon: "Oil" };
    case "Flours and Grains":
      return { bg: "#92400E", fg: "#FFFBEB", icon: "Grain" };
    case "Rice Products":
      return { bg: "#1E3A8A", fg: "#EFF6FF", icon: "Rice" };
    case "Salt":
      return { bg: "#334155", fg: "#F8FAFC", icon: "Salt" };
    case "Dairy and Beverages":
      return { bg: "#0F766E", fg: "#ECFEFF", icon: "Cup" };
    case "Carbonated Drinks":
      return { bg: "#7C2D12", fg: "#FFF7ED", icon: "Bottle" };
    case "Biscuits and Cookies":
      return { bg: "#6D28D9", fg: "#F5F3FF", icon: "Cookie" };
    default:
      return { bg: "#0F172A", fg: "#F8FAFC", icon: "Bag" };
  }
}

function wrapWords(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxLen) {
      cur = next;
      continue;
    }
    if (cur) lines.push(cur);
    cur = w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  const pid = decodeURIComponent(id);
  const p = catalog.find((x) => x.id === pid);
  if (!p) {
    return new NextResponse("Not found", { status: 404 });
  }

  const t = theme(p.category);
  const titleLines = wrapWords(p.name, 18);
  const sub = `${p.unit} • ₹${p.price}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="${esc(
    p.name,
  )}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bg}" stop-opacity="1"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="400" height="400" rx="28" fill="url(#g)"/>

  <g opacity="0.18">
    <circle cx="70" cy="80" r="52" fill="${t.fg}"/>
    <circle cx="340" cy="320" r="68" fill="${t.fg}"/>
  </g>

  <g filter="url(#s)">
    <rect x="36" y="42" width="328" height="316" rx="22" fill="rgba(255,255,255,0.10)"/>
  </g>

  <text x="56" y="92" fill="${t.fg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="18" font-weight="700" opacity="0.95">${esc(
    t.icon,
  )}</text>
  <text x="56" y="118" fill="${t.fg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="12" font-weight="600" opacity="0.85">${esc(
    p.category,
  )}</text>

  ${titleLines
    .map((line, i) => {
      const y = 200 + i * 34;
      return `<text x="200" y="${y}" text-anchor="middle" fill="${t.fg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="26" font-weight="800" letter-spacing="0.2">${esc(
        line,
      )}</text>`;
    })
    .join("\n  ")}

  <text x="200" y="328" text-anchor="middle" fill="${t.fg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="700" opacity="0.9">${esc(
    sub,
  )}</text>

  <text x="200" y="354" text-anchor="middle" fill="${t.fg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="11" font-weight="600" opacity="0.7">${esc(
    pid,
  )}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

