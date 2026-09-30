import { ImageResponse } from "next/og";
import { HERO } from "@/lib/content/site";

/**
 * The card people actually see when this link is pasted into Slack, X,
 * WhatsApp or LinkedIn.
 *
 * Until now there was none, so every share rendered as a grey box with a
 * URL in it — which is the single most-seen view of a portfolio and the
 * one nobody designs. This is the site's own language at 1200x630: black
 * ground, the lime accent used once, display type at a size that survives
 * being thumbnailed in a chat list.
 *
 * DESIGNED FOR THE SMALL SIZE. Most of these are viewed at a few hundred
 * pixels wide in a message list, so there is no body copy on it — a name,
 * a role, and three facts that are independently checkable. Anything
 * smaller than the proof row would be unreadable at that scale and is
 * therefore not on the card.
 *
 * Generated at BUILD time (no request-time APIs), so it costs a visitor
 * nothing and the crawler gets a static PNG.
 */

export const alt = `${HERO.name} — offensive security engineer, founder of Overwatch Labs and Forensia`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Space Grotesk, fetched at build.
 *
 * Satori cannot read the fonts `next/font` installs, and it needs TTF or
 * OTF rather than the WOFF2 a modern browser is served. Requesting the
 * Google CSS WITHOUT a User-Agent is what gets the legacy TrueType URL
 * back, which is the whole trick.
 *
 * Wrapped in try/catch and allowed to return null: a build on a machine
 * with no network must still produce a card. Without the font it falls
 * back to Satori's default face — plainer, but present, which beats
 * failing the build over a typeface.
 */
async function spaceGrotesk(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@${weight}`
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

const LIME = "#c7f23a";
const GHOST = "#6a6a75";

/** Independently checkable, which is the only kind worth putting here. */
const PROOF = [
  { k: "Published", v: "CVE-2025-56459" },
  { k: "Certified", v: "OSCP" },
  { k: "Tested", v: "500+ applications" },
];

export default async function Image() {
  const [bold, regular] = await Promise.all([
    spaceGrotesk(700),
    spaceGrotesk(400),
  ]);

  const fonts = [
    bold && { name: "Grotesk", data: bold, weight: 700 as const, style: "normal" as const },
    regular && { name: "Grotesk", data: regular, weight: 400 as const, style: "normal" as const },
  ].filter(Boolean) as NonNullable<
    ConstructorParameters<typeof ImageResponse>[1]
  >["fonts"];

  return new ImageResponse(
    (
      // Satori needs an explicit `display: flex` on every element with more
      // than one child — it has no block layout. Each nested div below
      // declares it rather than relying on a default that does not exist.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          padding: "72px 80px",
          fontFamily: "Grotesk",
          position: "relative",
        }}
      >
        {/* A single lime hairline along the top edge: the accent appears
            exactly once, as it does on the site. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 6,
            display: "flex",
            background: `linear-gradient(to right, ${LIME}, rgba(199,242,58,0))`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 6,
              color: GHOST,
              textTransform: "uppercase",
            }}
          >
            {HERO.name}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 40,
              fontSize: 104,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -4,
            }}
          >
            <span style={{ color: "#ffffff" }}>{HERO.headline[0]}</span>
            <span style={{ color: GHOST }}>{HERO.headline[1]}</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontSize: 27,
              color: "#a8a8b2",
            }}
          >
            Overwatch Labs · Forensia
          </div>
        </div>

        {/* The proof row. Three facts, each one something a reader could
            go and verify, which is the only reason to put numbers on a
            card that will be seen for about a second. */}
        <div style={{ display: "flex", gap: 64, alignItems: "flex-end" }}>
          {PROOF.map((p) => (
            <div key={p.k} style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: 4,
                  color: GHOST,
                  textTransform: "uppercase",
                }}
              >
                {p.k}
              </span>
              <span
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontSize: 32,
                  fontWeight: 700,
                  color: p.v.startsWith("CVE") ? LIME : "#ffffff",
                }}
              >
                {p.v}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
