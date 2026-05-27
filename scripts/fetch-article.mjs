#!/usr/bin/env node
// Manual dev tool. Two modes:
//
//   SINGLE:  node scripts/fetch-article.mjs <x-status-url>
//   BATCH:   node scripts/fetch-article.mjs                (reads scripts/article-url.txt,
//                                                            one URL per line, # comments OK)
//
// NOT imported by the app. NOT run at build time. The app and the build
// must NEVER contact X — see scripts/og-probe.mjs for why (browser UA gets
// a 270 KB JS shell; only crawler UAs get a usable SSR stub).
//
// Field-swap finding from the probe: for X status URLs, the REAL ARTICLE
// TITLE sits in og:description, NOT og:title (which is the author profile
// string "...@handle on X"). This script reads og:description for the
// title. og:image is printed for the record but not stored — cards are
// imageless by owner decision.
//
// Batch rate-limit handling:
//   - 1500ms delay between requests (X throttles bursts of crawler-UA hits).
//   - On 429 / unexpectedly large body (JS shell) / missing og:description,
//     back off to 3000ms and retry that URL ONCE; if still bad, mark failed
//     and move on. Per-URL failures NEVER abort the batch.
//   - End-of-run: warn loudly if many titles look like "@handle on X" —
//     that signals X changed the response shape and the field-swap broke.

import { readFile } from "node:fs/promises";

const UA = "Twitterbot/1.0";
// Tunable via env for tiny re-runs that need more spacing between requests
// (X soft-throttles crawler-UA bursts; widening the delay helps stragglers).
const BASE_DELAY_MS = Number(process.env.BASE_DELAY_MS) || 1500;
const BACKOFF_DELAY_MS = Number(process.env.BACKOFF_DELAY_MS) || 3000;
const STUB_MAX_BYTES = 50_000; // larger = JS shell, not the SSR crawler stub
const DEFAULT_URL_FILE = "scripts/article-url.txt";

// Per-failure-class retry caps. 404 is more retryable than it sounds: X
// occasionally 404s LIVE articles to crawler UAs under load, so a single
// 404 is not proof of deletion. Cap at 2 retries — beyond that it's either
// a genuine deletion or X persistently refusing the URL.
const MAX_RETRIES_DEFAULT = 1; // 429, 5xx, JS-shell, missing og:description
const MAX_RETRIES_NOT_FOUND = 2;

// Twitter snowflake epoch — id >> 22 + this = ms since UNIX epoch.
const TWITTER_EPOCH_MS = 1288834974657n;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function extractMeta(html, key) {
  const attr = key.startsWith("og:") ? "property" : "name";
  const r1 = new RegExp(
    `<meta\\s+(?:[^>]*?\\s+)?${attr}=["']${key}["'][^>]*?content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const r2 = new RegExp(
    `<meta\\s+[^>]*?content=["']([^"']*)["'][^>]*?${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  const m = html.match(r1) || html.match(r2);
  return m ? decode(m[1].trim()) : null;
}

function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join("-")
      .replace(/-+/g, "-") || "article"
  );
}

function snowflakeToISODate(idStr) {
  try {
    const id = BigInt(idStr);
    const ms = Number((id >> 22n) + TWITTER_EPOCH_MS);
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Canonicalize: strip tracking params, normalize scheme/host.
function canonicalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // Strip the common X tracking params (s, t, etc.) — anything not the path.
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function looksLikeAuthorBoilerplate(title) {
  // X's og:title for status URLs is "@handle on X" / "Name (@handle) on X".
  // If og:description ever degrades to that string too, the field-swap is
  // broken — we want to know.
  return /\(@[A-Za-z0-9_]+\)\s*on\s*X\b/i.test(title);
}

// Fetch + parse a single URL once. Returns { ok: true, record } or
// { ok: false, reason, html?, status? }.
async function fetchOnce(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });
  } catch (e) {
    return { ok: false, reason: `network: ${e.message}` };
  }

  if (res.status === 429) {
    return { ok: false, reason: "HTTP 429 (rate-limited)", status: 429, retryable: true };
  }
  // 5xx — transient server error; almost always succeeds on retry.
  if (res.status >= 500 && res.status < 600) {
    return {
      ok: false,
      reason: `HTTP ${res.status} ${res.statusText}`,
      status: res.status,
      retryable: true,
    };
  }
  // 404 — usually means "not found," but X is documented (and observed in
  // this batch's URL #21) to serve 404 to crawler UAs for LIVE articles
  // under burst load. Retry with backoff up to MAX_RETRIES_NOT_FOUND.
  if (res.status === 404) {
    return {
      ok: false,
      reason: "HTTP 404 Not Found (may be flaky soft-throttle)",
      status: 404,
      retryable: true,
    };
  }
  if (res.status !== 200) {
    return { ok: false, reason: `HTTP ${res.status} ${res.statusText}`, status: res.status };
  }

  const html = await res.text();

  // The crawler-UA SSR stub is ~3-5 KB. A response > STUB_MAX_BYTES is the
  // JS shell — X has changed paths or is serving the wrong code branch.
  // Treat as retryable: another attempt may land on the right backend.
  if (html.length > STUB_MAX_BYTES) {
    return {
      ok: false,
      reason: `body ${html.length} bytes — JS shell, not SSR stub`,
      retryable: true,
    };
  }

  const title = extractMeta(html, "og:description");
  const image = extractMeta(html, "og:image");
  const ogUrl = extractMeta(html, "og:url");

  if (!title) {
    return {
      ok: false,
      reason: "og:description missing (response not the expected stub)",
      retryable: true,
    };
  }

  return {
    ok: true,
    record: { title, image, ogUrl },
  };
}

async function fetchWithBackoff(url) {
  let attempts = 0;
  let last = await fetchOnce(url);
  if (last.ok) return last;

  while (last.retryable) {
    const maxRetries =
      last.status === 404 ? MAX_RETRIES_NOT_FOUND : MAX_RETRIES_DEFAULT;
    if (attempts >= maxRetries) break;
    attempts++;
    // Backoff grows mildly with each attempt to give X more breathing room.
    await sleep(BACKOFF_DELAY_MS * attempts);
    last = await fetchOnce(url);
    if (last.ok) return { ...last, retried: attempts };
  }
  return { ...last, retried: attempts > 0 ? attempts : false };
}

async function loadUrlList() {
  // CLI args win — accepts ONE or MANY URLs. Each arg that matches the
  // X status-URL shape becomes a URL to fetch (handy for tiny re-runs
  // of failed URLs without editing the input file).
  const cliUrls = process.argv
    .slice(2)
    .filter((a) => /^https:\/\/x\.com\/[^/]+\/status\/\d+/i.test(a));
  if (cliUrls.length > 0) return cliUrls;

  // Reject lone non-URL args so typos don't silently fall through to the file.
  if (process.argv.length > 2) {
    console.error(
      "Usage: node scripts/fetch-article.mjs [<x-status-url> …]   (or omit to read scripts/article-url.txt)"
    );
    process.exit(2);
  }

  // Otherwise, batch mode from the default file.
  let text;
  try {
    text = await readFile(DEFAULT_URL_FILE, "utf8");
  } catch (e) {
    console.error(
      `No URL on command line and could not read ${DEFAULT_URL_FILE}: ${e.message}`
    );
    console.error("Either pass a URL as an argument or create the file.");
    process.exit(2);
  }
  const urls = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (urls.length === 0) {
    console.error(`${DEFAULT_URL_FILE} is empty (after filtering blanks/comments).`);
    process.exit(2);
  }
  return urls;
}

const urls = await loadUrlList();
const isBatch = urls.length > 1;

if (isBatch) {
  console.error(
    `Batch mode: ${urls.length} URLs from ${DEFAULT_URL_FILE} (${BASE_DELAY_MS}ms delay, retry on backoff).\n`
  );
}

const successes = [];
const failures = [];
const boilerplateHits = [];

for (let i = 0; i < urls.length; i++) {
  const raw = urls[i];
  const url = canonicalizeUrl(raw);
  const tag = isBatch ? `[${String(i + 1).padStart(2, "0")}/${urls.length}]` : "";

  if (isBatch) process.stderr.write(`${tag} ${url} ... `);

  const result = await fetchWithBackoff(url);

  if (!result.ok) {
    if (isBatch)
      console.error(
        `FAIL${result.retried ? " (after retry)" : ""}: ${result.reason}`
      );
    failures.push({ url, reason: result.reason, retried: !!result.retried });
  } else {
    const { title, image, ogUrl } = result.record;
    const canonicalUrl = canonicalizeUrl(ogUrl || url);
    const statusId = canonicalUrl.match(/\/status\/(\d+)/)?.[1] ?? null;
    const date = statusId ? snowflakeToISODate(statusId) : null;
    const id = slugify(title);
    const looksBoilerplate = looksLikeAuthorBoilerplate(title);

    if (looksBoilerplate) boilerplateHits.push({ url: canonicalUrl, title });

    successes.push({
      id,
      url: canonicalUrl,
      date,
      title,
      image,
      _meta: { retried: !!result.retried, boilerplate: looksBoilerplate },
    });

    if (isBatch)
      console.error(
        `OK${result.retried ? " (retry)" : ""}${
          looksBoilerplate ? " ⚠ boilerplate-shaped" : ""
        }`
      );
  }

  // Delay between requests (but not after the last one).
  if (i < urls.length - 1) await sleep(BASE_DELAY_MS);
}

// ============= Output =============
console.log("");
console.log("=".repeat(70));
console.log(
  `Batch complete: ${successes.length} OK · ${failures.length} failed · of ${urls.length} total`
);
console.log("=".repeat(70));

if (boilerplateHits.length > 0) {
  console.log("");
  console.log(
    `⚠  WARNING: ${boilerplateHits.length} of ${urls.length} title(s) look like "@handle on X" boilerplate.`
  );
  console.log(
    `   The og:description field-swap may have changed. Review these before pasting:`
  );
  for (const h of boilerplateHits) console.log(`   - ${h.url}\n     title: ${h.title}`);
  if (boilerplateHits.length > urls.length / 2) {
    console.log(
      `\n  STOP: more than half look boilerplate-shaped. X likely changed the response`
    );
    console.log(`  shape. Re-run scripts/og-probe.mjs to investigate before pasting.`);
  }
}

if (failures.length > 0) {
  console.log("");
  console.log("FAILURES — re-run individually after investigating:");
  for (const f of failures) {
    console.log(`  - ${f.url}`);
    console.log(`      ${f.reason}${f.retried ? " (retry also failed)" : ""}`);
  }
}

console.log("");
console.log(
  "Paste-ready Article[] (newest-first sort happens at render in articles.tsx):"
);
console.log("");

// Sort successes newest-first by derived date so the array reads in order.
const sortedSuccess = [...successes].sort((a, b) => {
  const ta = new Date(b.date).getTime() || 0;
  const tb = new Date(a.date).getTime() || 0;
  return ta - tb;
});

for (const s of sortedSuccess) {
  console.log(`    {
      id: ${JSON.stringify(s.id)},
      url: ${JSON.stringify(s.url)},
      // Derived from the Twitter snowflake ID; confirm if needed.
      date: ${JSON.stringify(s.date ?? "TODO: confirm")},
      title:
        ${JSON.stringify(s.title)},
      // og:image (NOT stored — cards imageless): ${s.image ?? "(none)"}
      // PLACEHOLDER — write a one-sentence hook in your voice.
      blurb: "TODO: confirm",
    },`);
}

console.log("");
console.log(
  `Summary: ${successes.length} of ${urls.length} fetched cleanly, ${failures.length} failed.`
);
if (failures.length > 0) {
  console.log(
    `Re-run failed URLs after a delay; X may have throttled mid-batch.`
  );
}
process.exit(failures.length > 0 ? 1 : 0);
