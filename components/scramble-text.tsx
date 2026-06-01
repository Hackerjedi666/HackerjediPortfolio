"use client";

import { useEffect, useRef } from "react";
import { getReducedMotion } from "@/lib/motion";

// Mono/hex-friendly chars — reads "code" not "random gibberish"
const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#$%&0123456789ABCDEF";

type Props = {
  children: string;
  /** ms delay before scramble starts (after intersection) */
  delay?: number;
  /** total scramble→resolve duration in ms */
  duration?: number;
  className?: string;
};

/**
 * Wraps a string and decodes it character-by-character when it first scrolls
 * into view. Each non-space char shows a random ASCII glyph until its left-to-
 * right "resolve cursor" reaches it, then locks to the real char.
 *
 * - One-shot per element (latched via fired ref) — won't re-scramble on scroll-back.
 * - aria-label holds the real text; the visible text changes mid-animation,
 *   but screen readers always announce the real string.
 * - prefers-reduced-motion → no scramble, real text shown immediately.
 * - SSR/no-JS fallback: real text is in the initial DOM. If JS never runs,
 *   nothing changes.
 */
export function ScrambleText({
  children,
  delay = 0,
  duration = 700,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;
    if (getReducedMotion()) return;

    const target = children;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          observer.disconnect();
          runScramble(el, target, delay, duration);
        }
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [children, delay, duration]);

  return (
    <span ref={ref} className={className} aria-label={children}>
      {children}
    </span>
  );
}

function runScramble(
  el: HTMLElement,
  target: string,
  delay: number,
  duration: number
) {
  const run = () => {
    const t0 = performance.now();
    const len = target.length;
    const tick = (ts: number) => {
      const t = Math.min(1, (ts - t0) / duration);
      const lockedCount = Math.floor(t * len);
      let output = "";
      for (let i = 0; i < len; i++) {
        if (i < lockedCount) {
          output += target[i];
        } else {
          const ch = target[i];
          if (ch === " " || ch === "\n" || ch === "\t") {
            output += ch;
          } else {
            output +=
              SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
          }
        }
      }
      el.textContent = output;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Snap to canonical final state (avoids any rounding residue)
        el.textContent = target;
      }
    };
    requestAnimationFrame(tick);
  };
  if (delay > 0) window.setTimeout(run, delay);
  else run();
}
