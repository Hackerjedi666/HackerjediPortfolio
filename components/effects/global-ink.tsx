"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useTier } from "@/lib/stage/use-stage";

/**
 * The site's background: one Navier–Stokes ink fluid across the whole page.
 *
 * This replaces both the previous per-section ink surfaces AND the separate
 * curl-noise cursor trail. Those two were doing near-identical jobs — an
 * accent-coloured wake following the pointer — and running both meant two
 * WebGL contexts fighting over the same visual territory, with the fluid
 * additionally clipped at every section boundary.
 *
 * Being viewport-fixed rather than section-scoped is what removes the hard
 * horizontal cut at section seams: there are no seams to cut against.
 *
 * three.js still arrives through `next/dynamic`, so a phone or a
 * reduced-motion visitor downloads none of it.
 */
const InkCanvas = dynamic(() => import("@/components/effects/ink-canvas"), {
  ssr: false,
});

export function GlobalInk() {
  const hostRef = useRef<HTMLDivElement>(null);
  const tier = useTier();

  // Always "in view" — it is the viewport. Only the device tier gates it.
  if (tier !== "full") return null;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-60 mix-blend-screen"
    >
      <InkCanvas hostRef={hostRef} />
    </div>
  );
}
