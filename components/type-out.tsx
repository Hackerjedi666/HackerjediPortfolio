"use client";

import { useEffect, useRef, useState } from "react";
import { getReducedMotion } from "@/lib/motion";

type Props = {
  children: string;
  /** ms per character */
  speed?: number;
  /** ms delay before typing starts */
  delay?: number;
  className?: string;
};

/**
 * Wraps a short string and types it out char-by-char with a blinking block
 * caret when it first scrolls into view. Caret disappears after typing
 * completes. Intended for mono captions (eyebrows, datelines, status labels)
 * — terminal command feel.
 *
 * - One-shot via fired ref (no re-type on scroll-back)
 * - aria-label holds full text for screen readers
 * - prefers-reduced-motion → shows real text immediately, no caret
 * - SSR/no-JS: initial DOM is the real text, no caret. If JS runs, the
 *   useEffect hides it briefly while typing, then shows the final text.
 */
export function TypeOut({
  children,
  speed = 28,
  delay = 0,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);

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
          start();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -5% 0px",
      }
    );
    observer.observe(el);

    const start = () => {
      const run = () => {
        setTyping(true);
        setTyped("");
        const t0 = performance.now();
        const tick = (ts: number) => {
          const elapsed = ts - t0;
          const idx = Math.min(target.length, Math.floor(elapsed / speed));
          setTyped(target.slice(0, idx));
          if (idx < target.length) {
            requestAnimationFrame(tick);
          } else {
            // Hold caret briefly post-completion, then hide
            window.setTimeout(() => setTyping(false), 350);
          }
        };
        requestAnimationFrame(tick);
      };
      if (delay > 0) window.setTimeout(run, delay);
      else run();
    };

    return () => observer.disconnect();
  }, [children, speed, delay]);

  // typed === null → not started yet, render real text (SSR/initial paint).
  // typed === string → JS has taken over, render current typed slice + caret.
  const visible = typed === null ? children : typed;

  return (
    <span ref={ref} className={className} aria-label={children}>
      {visible}
      {typing && <span className="type-caret" aria-hidden="true" />}
    </span>
  );
}
