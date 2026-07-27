"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, useGsap } from "@/lib/effects/gsap";
import { canAnimate } from "@/lib/stage/capability";

/**
 * A panel that unfolds inside a typographic block as you scroll.
 *
 * WHY THIS DOESN'T USE GSAP FLIP.
 * The source pack drives this with Flip: measure the open layout, revert,
 * then interpolate the two layouts under a scrub. That works in the demo
 * because the demo's headline is a fixed-size block. Here the headline is
 * fluid type (`clamp(2.125rem, 5.6vw, 4.75rem)`) with a `nowrap` clause, so
 * the two measured states wrap differently — and Flip compensates for a
 * changed measured width by *scaling* the element. The result was the
 * trailing clause rendering at roughly double size and sliding off the left
 * edge, on top of the section below it.
 *
 * So: the panel reserves its full box at all times and reveals with a
 * `clip-path` wipe, the inner scales down slightly for depth, and the
 * trailing clause shears. All three are compositor-only properties — no
 * layout is interpolated, nothing reflows, and no element can be scaled by
 * a measurement mismatch. Same visual idea, and it cannot glitch.
 */

type Props = {
  /** First line of the headline. */
  before: ReactNode;
  /** Trailing clause, shears as the panel opens. */
  after: ReactNode;
  /** Revealed inside the panel. */
  children: ReactNode;
  className?: string;
};

export function ScrollExpand({ before, after, children, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<HTMLSpanElement>(null);
  useGsap();

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !canAnimate()) return;

    const ctx = gsap.context(() => {
      // One shared scrub window so the wipe, the depth and the shear stay
      // locked to each other.
      const scrollTrigger = {
        trigger: wrap,
        start: "top 80%",
        end: "top 22%",
        scrub: 0.6, // slight lag — reads as weight rather than as tracking
      } as const;

      gsap.fromTo(
        panelRef.current,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger }
      );

      // The diagram is slightly oversized and settles to 1 — the panel reads
      // as a window opening onto something, not a box being drawn.
      gsap.fromTo(
        innerRef.current,
        { scale: 1.14 },
        { scale: 1, ease: "none", scrollTrigger }
      );

      gsap.fromTo(
        animRef.current,
        { skewX: 0, xPercent: 0 },
        { skewX: -6, xPercent: -2, ease: "none", scrollTrigger }
      );
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <span className="block">{before}</span>

      <div ref={panelRef} className="expand-panel">
        <div ref={innerRef} className="expand-panel-inner">
          {children}
        </div>
      </div>

      <span ref={animRef} className="expand-anim">
        {after}
      </span>
    </div>
  );
}
