"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, useGsap } from "@/lib/effects/gsap";
import { canAnimate } from "@/lib/stage/capability";
import { cn } from "@/lib/utils";

/**
 * Staircase grid whose cards unfold from the edge they connect on.
 *
 * Ported from the ConnectedGrid pack. The mechanic that makes it read as
 * "connected" rather than as a generic fade-up is the transform origin: each
 * card scales from 0, anchored to whichever side the *previous* card sat on.
 * A card below-and-left of its predecessor grows from its right edge, so the
 * two appear hinged together; a card below-and-right grows from its left.
 * The source derived that by comparing offsetLeft against the previous
 * sibling, which is exactly what's reimplemented here.
 *
 * Three scrubbed tracks per card, all on one ScrollTrigger:
 *   surface  scale 0 → 1 from the hinge
 *   content  scale 1.25 → 1, counter-zooming so the text doesn't smear
 *   header   slides in from the hinge side and fades up
 *
 * The pack scaled an image's inner from 5 → 1. Ours holds text, and a 5×
 * counter-scale turns type into mush on the way in — 1.25 gives the same
 * sense of depth while staying readable the whole way.
 */

export function ConnectedGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useGsap();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canAnimate()) return;

    const ctx = gsap.context(() => {
      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-cg-item]"));

      items.forEach((item) => {
        const previous = item.previousElementSibling as HTMLElement | null;
        // "Is this card to the left of the one before it?" — decides which
        // edge the card is hinged on.
        const isLeftSide =
          !!previous && item.offsetLeft + item.offsetWidth <= previous.offsetLeft + 1;
        const originX = isLeftSide ? 100 : 0;

        const surface = item.querySelector("[data-cg-surface]");
        const content = item.querySelector("[data-cg-content]");
        const header = item.querySelector("[data-cg-header]");

        gsap
          .timeline({
            defaults: { ease: "power4" },
            scrollTrigger: {
              trigger: item,
              start: "top bottom-=12%",
              end: "+=90%",
              scrub: true,
            },
          })
          .fromTo(
            surface,
            { scale: 0, transformOrigin: `${originX}% 0%` },
            { scale: 1 }
          )
          .fromTo(
            content,
            { scale: 1.25, transformOrigin: `${originX}% 0%`, opacity: 0 },
            { scale: 1, opacity: 1 },
            0
          )
          .fromTo(
            header,
            { xPercent: isLeftSide ? 60 : -60, opacity: 0 },
            { ease: "power1", xPercent: 0, opacity: 1 },
            0
          );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "connected-grid grid gap-x-6 gap-y-10 md:grid-cols-8",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * One cell. `col`/`span` place it on the 8-column track — the deliberate
 * asymmetry is what creates the staircase the animation hinges on.
 */
export function ConnectedItem({
  col,
  span,
  children,
  className,
}: {
  col: number;
  span: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-cg-item
      className={cn("relative", className)}
      style={
        {
          "--cg-col": col,
          "--cg-span": span,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
