"use client";

import { useEffect, useRef, useState } from "react";
import { CLIENT_LABELS, CVE_CHAIN } from "@/lib/content/site";

/**
 * The three tile animations that need JavaScript.
 *
 * All of them are TEXT. No canvas, no WebGL, no per-frame layout reads —
 * the page got heavy once already and the fix was cutting masked surfaces
 * and `will-change` layers, so nothing here adds either. A `setInterval`
 * swapping a string costs nothing measurable.
 *
 * Every one is gated on three things: reduced motion, visibility, and the
 * tab being in the foreground. A tile animating inside a collapsed sheet
 * or a background tab is pure waste, and `document.hidden` is the cheapest
 * guard there is.
 *
 * CSS DEFAULTS ARE THE VISIBLE STATE. Each component renders a real first
 * frame from the server — the first client label, step 01, the full trace
 * string. If the effect never runs, the tile reads as a static tile rather
 * than as an empty box, which is the failure mode that matters.
 */

/** Shared: advance an index on an interval, paused when out of view. */
function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => setI((n) => (n + 1) % length), ms);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const io = new IntersectionObserver(
      ([e]) => (e?.isIntersecting && !document.hidden ? start() : stop()),
      { rootMargin: "0px" }
    );
    io.observe(host);

    const onVis = () => (document.hidden ? stop() : undefined);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [length, ms]);

  return { i, hostRef };
}

/* ------------------------------------------------------------------ */

/**
 * Selected engagements: the anonymised client list, cycling.
 *
 * The tile already claims "clients stay anonymous, the tradecraft
 * doesn't". This is the tile keeping that promise in front of you — five
 * real sectors, no names, proving breadth without disclosing anything.
 * ops.tsx indexes into the same CLIENT_LABELS array, so the tile and the
 * panel behind it cannot disagree about who the clients are.
 */
export function ClientCycler() {
  const { i, hostRef } = useCycle(CLIENT_LABELS.length, 2600);

  return (
    <div ref={hostRef} className="tile-live tile-live-tr">
      <p className="tile-live-label">Under NDA</p>
      {/* `key` on the line is what makes the fade run: React replaces the
          node, so the enter animation restarts rather than the text simply
          swapping underneath a settled element. */}
      <p key={i} className="tile-live-line tile-live-enter">
        {CLIENT_LABELS[i]}
      </p>
      <p className="tile-live-count">
        {String(i + 1).padStart(2, "0")} / {String(CLIENT_LABELS.length).padStart(2, "0")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The CVE tile: the escalation, one step at a time.
 *
 * A stored-XSS-to-RCE finding IS a sequence, and a sequence is the one
 * thing a static tile cannot show. Four steps, each replacing the last,
 * with the step number carried so the reader knows where in the chain
 * they are rather than just seeing text change.
 */
export function ChainStepper() {
  const { i, hostRef } = useCycle(CVE_CHAIN.length, 2800);
  const step = CVE_CHAIN[i];

  return (
    <div ref={hostRef} className="tile-live tile-live-tr">
      <p className="tile-live-label">Escalation</p>
      <p key={i} className="tile-live-line tile-live-enter">
        <span className="tile-live-step">{step.step}</span>
        {step.short}
      </p>
      <span aria-hidden="true" className="tile-live-rail">
        {CVE_CHAIN.map((c, n) => (
          <span key={c.step} data-on={n <= i ? "true" : "false"} />
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const TRACE = ["0x71C7", "…", "3A90"].join("");
const HOPS = ["Bridge", "Mixer", "Tornado Cash"];

/**
 * What I build: a trace resolving.
 *
 * Forensia's whole pitch is "start from one identifier, follow the
 * connections". This shows exactly that in about four seconds — the
 * address, then the hops arriving one by one, then a reset. It is the
 * same sample trace the Ventures panel prints statically, so the tile
 * demonstrates the claim the panel makes.
 *
 * Labelled "Sample trace" for the same reason it is in the panel: it is
 * illustrative, not a real investigation, and saying so is cheap.
 */
export function AddressTrace() {
  // One extra step at the end holds the completed chain before it loops,
  // so the payoff is readable rather than flashing past.
  const { i, hostRef } = useCycle(HOPS.length + 2, 1300);
  const shown = Math.min(i, HOPS.length);

  return (
    <div ref={hostRef} className="tile-address-trace">
      <div className="tile-address-heading">
        <p className="tile-live-label">Sample trace</p>
        <p className="tile-live-mono">{TRACE}</p>
      </div>
      <span className="tile-live-hops">
        {HOPS.map((h, n) => (
          <span key={h} data-on={n < shown ? "true" : "false"}>
            {h}
          </span>
        ))}
      </span>
    </div>
  );
}
