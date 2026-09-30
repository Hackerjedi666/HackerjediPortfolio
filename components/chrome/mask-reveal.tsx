"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** "char" unmasks letter by letter; "word" is calmer for long lines. */
  by?: "char" | "word";
  /** Milliseconds between each piece. 18–35 reads deliberate; above ~60 drags. */
  stagger?: number;
  className?: string;
  as?: "span" | "p";
};

/**
 * Text that rises out from behind a mask, piece by piece, when scrolled to.
 *
 * This is the one genuinely reusable idea in VengeanceUI's `animated-footer`.
 * That component was not installed: it needs `next-themes` (a light/dark
 * switcher, on a site that deliberately has one theme — `useTheme()` returns
 * undefined without a provider it does not ship) and two source images to
 * sample into ASCII art, which this project does not have. Its ASCII canvas
 * also duplicates effects already here.
 *
 * The reveal itself is pure CSS plus an IntersectionObserver, so it costs
 * nothing and carries none of that.
 *
 * The mask is the point. Fading text in leaves it visible-but-wrong for the
 * whole transition; clipping each piece to its own overflow-hidden box means
 * it is genuinely absent and then genuinely there. Content starts VISIBLE in
 * CSS and the pre-entry state is only applied once the observer has decided
 * to animate it — so if the script never runs, the text is simply there.
 */
export function MaskReveal({
  text,
  by = "char",
  stagger = 22,
  className,
  as: Tag = "span",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pieces = Array.from(el.querySelectorAll<HTMLElement>("[data-piece]"));
    if (!pieces.length) return;

    // Apply the pre-entry state only now — before this line the text has been
    // readable the whole time.
    for (const p of pieces) p.classList.add("mask-piece-pre");

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        pieces.forEach((p, i) => {
          p.style.transitionDelay = `${i * stagger}ms`;
          p.classList.remove("mask-piece-pre");
        });
      },
      { rootMargin: "-12%" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stagger, text]);

  const parts = by === "char" ? [...text] : text.split(/(\s+)/);

  return (
    <Tag ref={ref as never} aria-label={text} className={cn("mask-reveal", className)}>
      {parts.map((part, i) =>
        /^\s+$/.test(part) ? (
          <span key={i}>{" "}</span>
        ) : (
          <span key={i} aria-hidden="true" className="mask-slot">
            <span data-piece className="mask-piece">
              {part === " " ? " " : part}
            </span>
          </span>
        )
      )}
    </Tag>
  );
}
