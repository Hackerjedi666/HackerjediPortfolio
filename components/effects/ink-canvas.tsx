"use client";

import { useEffect, useRef } from "react";
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

    const fluid = new InkFluid(canvas, host);
    const unsubscribe = subscribe((dt) => fluid.step(dt));

    return () => {
      unsubscribe();
      fluid.dispose();
    };
  }, [hostRef]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
