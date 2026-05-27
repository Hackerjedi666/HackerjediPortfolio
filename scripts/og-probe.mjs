#!/usr/bin/env node
// THROWAWAY PROBE — not imported by the app, not part of the build.
// Decides Articles section architecture: can X.com serve usable OG / Twitter
// Card metadata to a server-side fetch, or must article previews be manually
// curated? Run: `node scripts/og-probe.mjs`. Delete after the decision lands.

const URL_TARGET = "https://x.com/hackerjedi666/status/1990891573257925109";

// Known good values (from owner) — used only to judge each fetch's verdict.
const KNOWN_TITLE_CONTAINS = "TeeDotFail";
const KNOWN_TITLE_FULL =
  "Debunking the TeeDotFail Panic: Why TEEs Are Still Viable for Secure Computing";

const UA_BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const UA_TWITTERBOT = "Twitterbot/1.0";
const UA_GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const UA_FACEBOOK = "facebookexternalhit/1.1";

const FIELDS = [
  "<title>",
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "twitter:card",
];

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

// Two attr orders, both `property=` and `name=` for OG/Twitter overlap.
function extract(html, key) {
  if (key === "<title>") {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? decode(m[1].trim()) : null;
  }
  const attr = key.startsWith("og:") ? "property" : "name";
  // attr-before-content
  const r1 = new RegExp(
    `<meta\\s+(?:[^>]*?\\s+)?${attr}=["']${key}["'][^>]*?content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  // content-before-attr
  const r2 = new RegExp(
    `<meta\\s+[^>]*?content=["']([^"']*)["'][^>]*?${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  const m = html.match(r1) || html.match(r2);
  return m ? decode(m[1].trim()) : null;
}

function verdict(rows) {
  const title = rows["<title>"] || rows["og:title"] || rows["twitter:title"] || "";
  const desc = rows["og:description"] || rows["twitter:description"] || "";
  const image = rows["og:image"] || rows["twitter:image"] || "";

  if (/JavaScript is not available|JavaScript is disabled/i.test(title + " " + desc)) {
    return "LOGIN-WALL / JS-only stub";
  }
  if (title.includes(KNOWN_TITLE_CONTAINS)) {
    if (image) return "REAL metadata (title + image)";
    return "PARTIAL (real title, no image)";
  }
  if (/^X \(formerly Twitter\)$|^X$/i.test(title.trim())) {
    return "BOILERPLATE (generic X title)";
  }
  if (!title && !desc && !image) return "EMPTY (no meta extracted)";
  return "PARTIAL / UNKNOWN — manual review needed";
}

async function probe(label, ua) {
  console.log(`\n========================================`);
  console.log(`UA: ${label}`);
  console.log(`UA-string: ${ua}`);
  console.log(`========================================`);
  let res, html;
  try {
    res = await fetch(URL_TARGET, {
      headers: {
        "User-Agent": ua,
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });
    html = await res.text();
  } catch (e) {
    console.log(`FETCH ERROR: ${e.message}`);
    return { label, ua, error: e.message };
  }

  console.log(`status:        ${res.status} ${res.statusText}`);
  console.log(`final URL:     ${res.url}`);
  console.log(`content-type:  ${res.headers.get("content-type")}`);
  console.log(`html bytes:    ${html.length}`);

  const rows = {};
  for (const k of FIELDS) rows[k] = extract(html, k);

  const looksLoginWall =
    /JavaScript is not available|JavaScript is disabled|"login_form"/i.test(html);
  const hasAnyOg = /property=["']og:/i.test(html);
  console.log(`login-wall?:   ${looksLoginWall}`);
  console.log(`any og: tags?: ${hasAnyOg}`);

  console.log(`\nExtracted fields:`);
  for (const k of FIELDS) {
    const v = rows[k];
    const out = v === null ? "MISSING" : v.length > 200 ? v.slice(0, 200) + " …(truncated)" : v;
    console.log(`  ${k.padEnd(22)}: ${out}`);
  }

  console.log(`\nVERDICT: ${verdict(rows)}`);
  return { label, ua, status: res.status, rows, looksLoginWall, hasAnyOg };
}

console.log(`Target: ${URL_TARGET}`);
console.log(`Known title (for judgment): "${KNOWN_TITLE_FULL}"`);

const results = [];
results.push(await probe("Chrome 131 desktop", UA_BROWSER));
results.push(await probe("Twitterbot/1.0", UA_TWITTERBOT));
results.push(await probe("Googlebot", UA_GOOGLEBOT));
results.push(await probe("facebookexternalhit/1.1", UA_FACEBOOK));

console.log(`\n\n=================== SUMMARY ===================`);
console.log(`${"UA".padEnd(28)} | ${"status".padEnd(7)} | verdict`);
console.log("-".repeat(80));
for (const r of results) {
  if (r.error) {
    console.log(`${r.label.padEnd(28)} | ERROR   | ${r.error}`);
    continue;
  }
  console.log(`${r.label.padEnd(28)} | ${String(r.status).padEnd(7)} | ${verdict(r.rows)}`);
}

console.log(`\n=================== FIELD MATRIX ===================`);
const cols = results.map((r) => r.label);
console.log(`${"field".padEnd(22)} | ${cols.map((c) => c.padEnd(28)).join(" | ")}`);
console.log("-".repeat(22 + 3 + cols.length * 31));
for (const k of FIELDS) {
  const vals = results.map((r) => {
    if (r.error) return "ERROR";
    const v = r.rows[k];
    if (v === null) return "MISSING";
    return v.length > 26 ? v.slice(0, 25) + "…" : v;
  });
  console.log(`${k.padEnd(22)} | ${vals.map((v) => v.padEnd(28)).join(" | ")}`);
}
