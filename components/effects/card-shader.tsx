"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useStage } from "@/lib/stage/use-stage";

/**
 * Tier + viewport gate for the card light pass.
 *
 * Mounts only while its card is near the viewport on a device cleared for
 * WebGL, so scrolling past section 04 releases the context rather than
 * leaving two extra ones alive for the rest of the page.
 */
const CardShaderCanvas = dynamic(
  () => import("@/components/effects/card-shader-canvas"),
  { ssr: false }
);

export function CardShader() {
  const hostRef = useRef<HTMLDivElement>(null);
  const active = useStage(hostRef, { margin: "20% 0px 20% 0px" });

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
    >
      {active ? <CardShaderCanvas hostRef={hostRef} /> : null}
    </div>
  );
}
