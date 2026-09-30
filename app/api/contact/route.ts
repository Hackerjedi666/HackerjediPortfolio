import { NextResponse } from "next/server";

/**
 * Contact relay.
 *
 * Sends to the address below via Resend's REST API. No SDK: it is one POST
 * with a JSON body, and a dependency for that is not worth the bytes.
 *
 * NO KEY, NO SILENT FAILURE. If `RESEND_API_KEY` is absent this returns 501
 * with `configured: false`, and the client falls back to opening the
 * visitor's own mail client with the message prefilled. A contact form that
 * accepts a message and drops it is worse than one that admits it cannot
 * send — the visitor thinks they have reached you and you never hear from
 * them.
 *
 * TO GO LIVE: set RESEND_API_KEY, and verify a sending domain with Resend so
 * `from` can be an address on it. Until then FROM stays on Resend's shared
 * onboarding sender, which works but is more likely to be filtered.
 */

const TO = "abhimanyu.gupta@overwatchlabs.ai";
const FROM = process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>";

/** Deliberately loose — the aim is to reject obvious junk, not to police
 *  valid addresses, and every clever email regex rejects real ones. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = { name: 120, email: 254, message: 4000 } as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed body." }, { status: 400 });
  }

  const { name, email, message } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const clean = {
    name: name.trim().slice(0, LIMITS.name),
    email: email.trim().slice(0, LIMITS.email),
    message: message.trim().slice(0, LIMITS.message),
  };

  if (!clean.name || !clean.message) {
    return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
  }
  if (!EMAIL.test(clean.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }
  // Newlines in a field that ends up near a header are the classic injection
  // vector. Resend takes JSON so this is belt-and-braces, but the name is
  // used as a display name and must stay single-line regardless.
  clean.name = clean.name.replace(/[\r\n]+/g, " ");

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        configured: false,
        error: "Mail relay is not configured on this deployment.",
      },
      { status: 501 }
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        // So a reply goes straight back to the visitor rather than to Resend.
        reply_to: clean.email,
        subject: `Portfolio enquiry from ${clean.name}`,
        text: [
          `Name:  ${clean.name}`,
          `Email: ${clean.email}`,
          "",
          clean.message,
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      // The upstream body can contain the key's own error detail; log it
      // server-side, never hand it to the browser.
      console.error("resend failed", res.status, await res.text());
      return NextResponse.json({ error: "Send failed upstream." }, { status: 502 });
    }
  } catch (err) {
    console.error("resend threw", err);
    return NextResponse.json({ error: "Send failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
