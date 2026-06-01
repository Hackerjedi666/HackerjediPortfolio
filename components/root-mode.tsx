"use client";

import { useEffect } from "react";

// Classic Konami: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

/**
 * Easter egg — type the Konami code anywhere on the page, the whole site
 * inverts to terminal green-on-black ("ROOT MODE"). Type it again to return.
 *
 * Implementation:
 *   - Keeps a rolling buffer of the last 10 key codes.
 *   - On match, toggles `html.root-mode`. CSS in globals.css overrides all
 *     palette tokens to terminal-green + OLED-black, so the whole site
 *     re-themes via existing token consumption — no per-section changes.
 *   - Tracks `event.code` (not `key`) so the shortcut is layout-independent
 *     (works on Dvorak / Colemak / non-US keyboards for the letter keys).
 *   - No-op when typing inside an input/textarea — won't trigger when the
 *     user is filling forms (none on this site today, but defensive).
 */
export function RootMode() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const buffer: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;

      buffer.push(e.code);
      if (buffer.length > KONAMI.length) buffer.shift();
      if (buffer.length !== KONAMI.length) return;
      if (KONAMI.every((k, i) => buffer[i] === k)) {
        document.documentElement.classList.toggle("root-mode");
        buffer.length = 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
