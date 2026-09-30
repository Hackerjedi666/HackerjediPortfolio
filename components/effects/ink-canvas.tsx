"use client";

import { useEffect, useRef } from "react";
import { Color } from "three";
import { InkFluid } from "@/lib/effects/ink-fluid";
import { subscribe } from "@/lib/stage/ticker";

/**
 * The ink simulation itself. Only ever mounted by `<GlobalInk>` once the
 * device is known to support WebGL — so this module (and three.js with
 * it) is never fetched otherwise.
 */
export default function InkCanvas({ hostRef }: { hostRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    // Read the accent off the live CSS token, exactly like the card shader and
    // the modulo canvas do. This was the ONLY effect carrying a hardcoded
    // colour, which is why it kept painting acid green after the palette
    // moved to champagne.
    const css = getComputedStyle(host).getPropertyValue("--color-acid").trim();
    const fluid = new InkFluid(canvas, host, css ? { inkColor: new Color(css) } : {});
    const unsubscribe = subscribe((dt) => fluid.step(dt));

    return () => {
      unsubscribe();
      fluid.dispose();
    };
  }, [hostRef]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
