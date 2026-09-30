"use client";

import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";
import type { RoughAnnotation } from "rough-notation/lib/model";

type Action = "highlight" | "underline" | "box" | "circle" | "bracket";

type Props = {
  children: React.ReactNode;
  action?: Action;
  /** Defaults to the live accent token, so it follows the palette. */
  color?: string;
  strokeWidth?: number;
  durationMs?: number;
  iterations?: number;
  padding?: number;
};

/**
 * A drawn annotation over a phrase.
 *
 * Ported from MagicUI's `highlighter` rather than installed: that component
 * pulls in `motion` purely for `useInView`, which is an IntersectionObserver
 * with extra steps and ~30KB of dependency. This uses the observer directly,
 * so the only thing added to the project is `rough-notation` itself.
 *
 * Two deliberate changes:
 *
 *   1. The colour defaults to the live `--color-acid` token read off the
 *      element, instead of MagicUI's hardcoded pink. rough-notation paints
 *      into a canvas and cannot resolve a CSS variable itself, so the value
 *      is resolved here — which keeps the annotation on the palette.
 *   2. It draws ONCE, when scrolled into view, and `iterations` defaults to
 *      1 rather than 2. A double-stroke reads as a marker pen; a single
 *      pass reads as someone marking a document.
 *
 * Used sparingly on purpose. The accent means signal on this site, and an
 * annotation is the loudest accent available.
 */
export function Highlighter({
  children,
  action = "highlight",
  color,
  strokeWidth = 1.5,
  durationMs = 700,
  iterations = 1,
  padding = 2,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Stillness was asked for: render the text, draw nothing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let annotation: RoughAnnotation | null = null;
    let resize: ResizeObserver | null = null;
    let settle = 0;

    const draw = () => {
      // A highlight paints BEHIND live text, so it reads from --color-marker
      // (a wash) rather than --color-acid (a signal colour chosen to contrast
      // with the BACKGROUND, which means it fights the words on top of it).
      // On the bone panels the accent darkens to olive, and a solid olive
      // block under grey body copy is exactly as unreadable as it sounds.
      // Every other annotation type still draws in the accent, because an
      // underline or a box sits beside the text rather than under it.
      const style = getComputedStyle(el);
      const token = action === "highlight" ? "--color-marker" : "--color-acid";
      const resolved =
        color ||
        style.getPropertyValue(token).trim() ||
        style.getPropertyValue("--color-acid").trim() ||
        "#c7f23a";

      annotation = annotate(el, {
        type: action,
        color: resolved,
        strokeWidth,
        animationDuration: durationMs,
        iterations,
        padding,
        multiline: true,
      });
      annotation.show();

      // The annotation is drawn at a fixed size; a reflow (font load, a
      // breakpoint change, the sheet opening) leaves it stranded beside the
      // text unless it is redrawn.
      resize = new ResizeObserver(() => {
        annotation?.hide();
        annotation?.show();
      });
      resize.observe(el);
    };

    /**
     * Draw only once the text has stopped moving.
     *
     * rough-annotation positions its SVG from the element's rect AT DRAW
     * TIME. The IntersectionObserver fires the instant the element is
     * visible — which, inside a bento sheet, is the first frame of the
     * sheet's open animation, while the whole panel is still sliding and
     * scaling. The highlight was therefore laid down against a rect the
     * text had already left, and it ended up over a completely different
     * clause: "domain controller wea" instead of the sentence it was meant
     * to mark. The ResizeObserver below could not save it, because the
     * element's SIZE never changed. Only its position did.
     *
     * So: poll the rect and draw on the first frame it matches the previous
     * one, with a hard cap so a genuinely never-still element (a marquee,
     * say) still gets its annotation rather than none at all.
     */
    const drawWhenStill = () => {
      let last: DOMRect | null = null;
      let frames = 0;

      const tick = () => {
        const now = el.getBoundingClientRect();
        const still =
          last !== null &&
          Math.abs(now.top - last.top) < 0.5 &&
          Math.abs(now.left - last.left) < 0.5;

        if (still || frames > 90) {
          draw();
          return;
        }
        last = now;
        frames += 1;
        settle = requestAnimationFrame(tick);
      };
      settle = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        drawWhenStill();
      },
      { rootMargin: "-10%" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(settle);
      resize?.disconnect();
      annotation?.remove();
    };
  }, [action, color, strokeWidth, durationMs, iterations, padding]);

  return (
    <span ref={ref} className="relative inline-block bg-transparent">
      {children}
    </span>
  );
}
