"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { gsap, useGsap } from "@/lib/effects/gsap";
import { canAnimate } from "@/lib/stage/capability";
import { cn } from "@/lib/utils";

/**
 * A link that leans toward the cursor and springs back.
 *
 * The first version of this used a linear CSS transition, which moves but
 * doesn't feel like anything. This is the magnetic-button pack's actual
 * mechanic: `gsap.quickTo` with `elastic.out(1, 0.3)`. quickTo builds a
 * reusable tween once and just retargets it on each pointer move, so
 * tracking the cursor costs no allocation, and the elastic ease is what
 * makes release feel like a physical object settling rather than a value
 * interpolating.
 *
 * `strength` scales the pull — social icons in the footer take a much
 * stronger pull than a nav button, which is what makes them read as a
 * cluster of magnets rather than a row of links.
 */

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  /** Pixels of travel at the element's edge. Socials use ~28, buttons ~12. */
  strength?: number;
  "aria-label"?: string;
};

export function MagneticLink({
  href,
  children,
  className,
  external,
  strength = 12,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const xTo = useRef<((v: number) => void) | null>(null);
  const yTo = useRef<((v: number) => void) | null>(null);
  useGsap();

  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return;

    const ctx = gsap.context(() => {
      xTo.current = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
      yTo.current = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    }, el);

    return () => {
      xTo.current = null;
      yTo.current = null;
      ctx.revert();
    };
  }, []);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || !xTo.current || !yTo.current) return;
    const r = el.getBoundingClientRect();
    // Normalised offset from centre, so the pull is proportional to how far
    // off-centre the cursor is rather than to the element's size.
    xTo.current(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
    yTo.current(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 1.5);
  };

  const reset = () => {
    xTo.current?.(0);
    yTo.current?.(0);
  };

  const shared = {
    ref,
    className: cn("will-change-transform", className),
    onPointerMove: onMove,
    onPointerLeave: reset,
    onBlur: reset,
    "aria-label": ariaLabel,
  };

  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a
        {...shared}
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link {...shared} href={href}>
      {children}
    </Link>
  );
}
