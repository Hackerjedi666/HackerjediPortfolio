"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// Fixed-position theme toggle. Lives globally in the layout.
//
// Corner choice: TOP-RIGHT (top-3u right-3u, 24px inset). Why:
//  • Masthead h1 is anchored left (cols 3–9) — top-right is empty space.
//  • "PROFILE 001 / 2026" dateline lives at top-LEFT — opposite corner.
//  • Next.js dev "N" badge lives at bottom-LEFT — opposite corner.
//  • Every section h2 sits in col-start-3, far from the top-right rail.
//  Top-right is reachable at every scroll position, conflict-free.
//
// No-flash discipline: the visible icon is driven by CSS [data-theme]
// selectors (see globals.css .theme-icon rules), NOT by React state.
// So the icon ALWAYS matches what the boot script set, even before
// hydration finishes. React state only drives the aria-label, which is
// invisible and tolerates a one-tick lag.
type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) ?? "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    const apply = () => {
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* private mode / quota — theme still applies for this session */
      }
      setTheme(next);
    };

    // === FALLBACK GATES (instant, clean, no half-animation) ===
    // 1) No View Transitions API (Firefox, Safari < 18, older Chromium).
    // 2) prefers-reduced-motion: reduce.
    // Both paths: apply theme synchronously, return. The CSS keyframes
    // are still defined but are never invoked because startViewTransition
    // is never called.
    const noVT =
      typeof document === "undefined" ||
      typeof (document as Document & {
        startViewTransition?: (cb: () => void) => unknown;
      }).startViewTransition !== "function";
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (noVT || reducedMotion) {
      apply();
      return;
    }

    // === ANIMATED PATH ===
    // Compute the reveal origin (button center) + the farthest viewport
    // corner distance so the circle always reaches the opposite edge.
    const btn = document.querySelector<HTMLButtonElement>(
      "[data-theme-toggle]"
    );
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxX = Math.max(cx, window.innerWidth - cx);
      const maxY = Math.max(cy, window.innerHeight - cy);
      const radius = Math.hypot(maxX, maxY);
      const root = document.documentElement;
      root.style.setProperty("--theme-reveal-x", `${cx}px`);
      root.style.setProperty("--theme-reveal-y", `${cy}px`);
      root.style.setProperty("--theme-reveal-r", `${radius}px`);
    }

    (
      document as Document & {
        startViewTransition: (cb: () => void) => { finished: Promise<void> };
      }
    ).startViewTransition(apply);
  };

  const ariaLabel = mounted
    ? theme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme"
    : "Switch theme";

  return (
    <button
      type="button"
      data-theme-toggle
      aria-label={ariaLabel}
      onClick={flip}
      className="
        group fixed right-3u top-3u z-50
        flex h-5u w-5u items-center justify-center
        rounded-full border border-rule bg-paper-deep
        text-ink-mute
        hover:border-accent hover:text-ink
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
      "
    >
      {/* Both icons stacked; CSS [data-theme] selectors swap which is
          visible. Rotating + scaling cross-fade gives the tactile morph
          (~280ms each, no overlap = no muddy mid-state). */}
      <Sun
        aria-hidden="true"
        className="theme-icon theme-icon--light pointer-events-none absolute h-3u w-3u"
      />
      <Moon
        aria-hidden="true"
        className="theme-icon theme-icon--dark pointer-events-none absolute h-3u w-3u"
      />
    </button>
  );
}
