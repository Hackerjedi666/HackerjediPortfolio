"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * One registration point for GSAP plugins.
 *
 * `gsap.registerPlugin` is idempotent, but importing a plugin from three
 * different components means three module graphs referencing it — keeping it
 * to one import site means each plugin lands in the bundle once.
 *
 * Flip is deliberately NOT registered. The scroll expansion originally used
 * it and now animates clip-path instead (see components/effects/
 * scroll-expand.tsx for why), so registering it would ship ~49 KB of dead
 * plugin.
 */
let registered = false;

export function useGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger };
