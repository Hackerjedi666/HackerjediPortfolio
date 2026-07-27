"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { getTier, watchTier, type Tier } from "@/lib/stage/capability";

/**
 * The device tier, as reactive state.
 *
 * This is a textbook external store: the source of truth is matchMedia, it
 * changes outside React, and it must not be read during render on the
 * server. `useSyncExternalStore` is the primitive for exactly that —
 * `getTier` is cached so the snapshot is referentially stable between
 * changes, and the server snapshot is `null` so nothing WebGL-related is
 * ever emitted in the SSR payload.
 */
export function useTier(): Tier | null {
  return useSyncExternalStore<Tier | null>(
    watchTier,
    getTier,
    () => null // server + first hydration pass
  );
}

/**
 * "Is this effect allowed to draw right now?"
 *
 * An effect is live only when all three are true:
 *   1. the device tier permits it,
 *   2. its host section is on (or near) screen,
 *   3. the tab is visible — handled centrally by the ticker.
 *
 * This is what keeps the page to at most one or two simulations at a time:
 * the hero's ASCII fluid tears down as you scroll into the ops, and the
 * Ventures ink sim doesn't exist until you're nearly there.
 */
export function useStage(
  ref: RefObject<HTMLElement | null>,
  {
    /** Start work slightly before the section is visible so it isn't blank on arrival. */
    margin = "20% 0px 20% 0px",
    /** Minimum tier required. WebGL effects pass "full". */
    require: requiredTier = "full" as Tier,
  } = {}
): boolean {
  const tier = useTier();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);

  if (tier === null) return false;
  if (requiredTier === "full" && tier !== "full") return false;
  if (requiredTier === "lite" && tier === "static") return false;

  return inView;
}
