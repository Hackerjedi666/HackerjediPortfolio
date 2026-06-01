// Motion-system singletons. The MotionProvider client component initializes
// Lenis + GSAP + ScrollTrigger once and registers them here. Other client
// components (cursor, scroll-progress, section-rail) read from these getters
// instead of receiving props or pulling React context for every interaction.
//
// `null` is a valid runtime value — it means motion is OFF (reduced-motion,
// touch-only device, or pre-mount). Consumers must defensively check.

import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;
let reducedMotion = false;

export function setLenis(l: Lenis | null) {
  lenisInstance = l;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function setReducedMotion(v: boolean) {
  reducedMotion = v;
}

export function getReducedMotion(): boolean {
  return reducedMotion;
}
