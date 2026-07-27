"use client";

import type { ElementType, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { gsap, useGsap } from "@/lib/effects/gsap";
import { CardShader } from "@/components/effects/card-shader";
import { canAnimate } from "@/lib/stage/capability";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Rendered element — `article` for ops/ventures, `div` for capability tiles. */
  as?: ElementType;
  /** Glow diameter in px. Big cards get a wider, softer pool. */
  size?: number;
  /** Peak glow alpha. */
  intensity?: number;
  /** White glow instead of acid — used by the neutral venture card. */
  neutral?: boolean;
  /** Max rotation in degrees. 0 disables tilt (used where cards are tall). */
  tilt?: number;
  /** Pixels the card rises toward the viewer on hover. */
  lift?: number;
  /** Adds the velocity-reactive WebGL light pass. Section 04 only — it costs
   *  a WebGL context per card, so it is opt-in rather than default. */
  shader?: boolean;
};

/**
 * The card surface: three layers that together read as one solid object.
 *
 *   1. TILT — the card rotates a few degrees toward the cursor on X and Y.
 *      This is what makes it read as a physical panel under a light rather
 *      than a rectangle on a page. Kept small (≤6°) on purpose: past about
 *      8° the text starts to look keystoned and cheap.
 *   2. SHEEN — a hard-edged specular band that tracks the pointer across the
 *      surface. It's what sells the tilt, because a rotating surface with
 *      constant shading doesn't look like it's rotating at all.
 *   3. GLOW — a soft radial pool of accent light following the cursor.
 *
 * All three are driven by `gsap.quickTo`, so pointer tracking retargets one
 * reusable tween per property instead of allocating per move. GSAP owns the
 * transform completely — do not put a Tailwind `hover:-translate-*` on a
 * tilting card, the two will fight over the same property.
 */
export function GlowCard({
  children,
  className,
  as: Tag = "div",
  size = 460,
  intensity = 0.09,
  neutral = false,
  tilt = 5,
  lift = 8,
  shader = false,
}: Props) {
  const hostRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const quick = useRef<{
    rx?: (v: number) => void;
    ry?: (v: number) => void;
    y?: (v: number) => void;
    sheen?: (v: number) => void;
  }>({});

  useGsap();

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !canAnimate()) return;

    const ctx = gsap.context(() => {
      const ease = "power3.out";
      quick.current.rx = gsap.quickTo(el, "rotateX", { duration: 0.6, ease });
      quick.current.ry = gsap.quickTo(el, "rotateY", { duration: 0.6, ease });
      quick.current.y = gsap.quickTo(el, "y", { duration: 0.6, ease });
      if (sheenRef.current) {
        quick.current.sheen = gsap.quickTo(sheenRef.current, "xPercent", {
          duration: 0.5,
          ease,
        });
      }
    }, el);

    return () => {
      quick.current = {};
      ctx.revert();
    };
  }, []);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    quick.current.ry?.((px - 0.5) * tilt * 2);
    quick.current.rx?.(-(py - 0.5) * tilt * 2);
    quick.current.y?.(-lift);
    // Sheen sweeps the full width, offset so the highlight leads the cursor.
    quick.current.sheen?.(px * 200 - 100);

    const glow = glowRef.current;
    if (glow) {
      glow.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      glow.style.opacity = "1";
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        glow.style.opacity = "0";
      }, 500);
    }
  };

  const onLeave = () => {
    quick.current.rx?.(0);
    quick.current.ry?.(0);
    quick.current.y?.(0);
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  const tint = neutral
    ? `rgba(255,255,255,${intensity})`
    : `color-mix(in srgb, var(--color-acid) ${intensity * 100}%, transparent)`;

  return (
    <Tag
      ref={hostRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("tilt-card relative overflow-hidden", className)}
    >
      <span
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-full opacity-0 transition-opacity duration-200 will-change-transform"
        style={{
          width: size,
          height: size,
          margin: `${-size / 2}px 0 0 ${-size / 2}px`,
          background: `radial-gradient(circle, ${tint}, transparent 70%)`,
        }}
      />
      {/* Specular band. Narrow, low-alpha and skewed — it should read as
          light catching an edge, never as a visible gradient rectangle. */}
      <span
        ref={sheenRef}
        aria-hidden="true"
        className="card-sheen pointer-events-none absolute inset-y-0 left-0 w-full will-change-transform"
      />
      {/* Sits above the CSS layers but below the content, so the light plays
          across the card surface without washing out the copy. */}
      {shader ? <CardShader /> : null}
      {children}
    </Tag>
  );
}
