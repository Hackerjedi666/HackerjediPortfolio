/**
 * What this device is allowed to render.
 *
 * Three of the six animation packs are real simulations — an ASCII FLIP
 * fluid (CPU), a Navier–Stokes solver (~30 GPU passes/frame) and a
 * curl-noise trail (2 passes/frame). Shipping all of them unconditionally
 * would be fine on a desktop and miserable on a mid-range phone. This is the
 * single place that decides which tier a visitor gets; every effect asks
 * here rather than sniffing the environment itself.
 *
 *   full   — desktop-class: mouse, ≥4 cores, WebGL2. Everything runs.
 *   lite   — capable but not comfortable: WebGL effects off, GSAP/CSS on.
 *   static — reduced-motion, or no WebGL at all. Nothing animates.
 *
 * Reduced-motion always wins. It is a stated preference, not a guess about
 * hardware, so it is checked first and is not overridable by core count.
 */

export type Tier = "full" | "lite" | "static";

let cached: Tier | null = null;

function detect(): Tier {
  if (typeof window === "undefined") return "static";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "static";
  }

  // No fine pointer means a phone or tablet. The heavy effects are all
  // pointer-driven — without a hovering cursor they're invisible work.
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return "lite";

  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores < 4) return "lite";

  // `deviceMemory` is Chromium-only; absence is not evidence of a weak
  // device, so only act on a low reported value.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory < 4) return "lite";

  if (!hasWebGL()) return "static";

  return "full";
}

let webglResult: boolean | null = null;

/** One-shot WebGL2 probe. The context is discarded immediately. */
function hasWebGL(): boolean {
  if (webglResult !== null) return webglResult;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webglResult = !!gl;
    // Free the context slot right away — browsers cap concurrent contexts
    // (~16), and we need ours for the real effects.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglResult = false;
  }
  return webglResult;
}

/**
 * The device's tier. Cached — this is called from several effects on mount
 * and the answer cannot change without a reload (except reduced-motion,
 * handled by `watchTier`).
 */
export function getTier(): Tier {
  if (cached === null) cached = detect();
  return cached;
}

/** True when WebGL simulations are permitted. */
export function canRenderWebGL(): boolean {
  return getTier() === "full";
}

/** True when GSAP scroll/hover choreography is permitted. */
export function canAnimate(): boolean {
  return getTier() !== "static";
}

/**
 * Subscribe to tier changes. Only reduced-motion can flip at runtime (the
 * user toggles it in OS settings), and when it does every effect must stand
 * down immediately.
 */
export function watchTier(onChange: (tier: Tier) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = null;
    onChange(getTier());
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
