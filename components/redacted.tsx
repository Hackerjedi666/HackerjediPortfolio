"use client";

import { useEffect, useRef, useState } from "react";
import { getReducedMotion } from "@/lib/motion";

type Props = {
  children: string;
  /** ms delay after intersection before the scan begins */
  delay?: number;
  className?: string;
};

/**
 * Renders text covered by a solid █████ "redaction bar" that lifts off via a
 * left-to-right scan-line sweep when the element first enters the viewport.
 * Reads as a classified intelligence brief being declassified in real time.
 *
 * Implementation:
 *   - The text itself sits underneath, normally typeset; aria-label preserves
 *     the real string for screen readers regardless of visual state.
 *   - ::after is the solid bar (color: --color-ink), clip-path: inset(0)
 *     initially. On .revealed it animates to clip-path: inset(0 0 0 100%)
 *     — sweeping off to the left.
 *   - ::before is the bright accent scan line that travels with the
 *     receding edge of the redaction.
 *   - One-shot: latched via fired ref. No re-redaction on scroll-back.
 *
 * Reduced-motion: instant reveal (no animation, no scan line).
 * SSR fallback: real text is in the DOM; if JS doesn't run, the redaction
 * never applies (the :not(.redacted) state shows real text).
 */
export function Redacted({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);

    if (getReducedMotion()) {
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el || fired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          observer.disconnect();
          window.setTimeout(() => setRevealed(true), delay);
        }
      },
      {
        threshold: 0.4,
        rootMargin: "0px 0px -5% 0px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // Before mount: render plain text (SSR / no-JS path). After mount: redacted
  // until revealed. This guarantees the SSR HTML shows real content (no
  // permanently-invisible text if JS fails).
  const cls = mounted
    ? `redacted ${revealed ? "revealed" : ""} ${className}`.trim()
    : className;

  return (
    <span ref={ref} className={cls} aria-label={children}>
      {children}
    </span>
  );
}
