/**
 * One requestAnimationFrame loop for the whole site.
 *
 * Six animation packs each shipped their own `requestAnimationFrame(tick)`.
 * Running them as-is means N independent loops competing for the same frame
 * budget, with no way to know the total cost or to stop them together. This
 * is the single loop they all subscribe to instead.
 *
 * Properties that matter:
 *   - The loop only runs while something is subscribed. Zero subscribers,
 *     zero rAF — an unmounted effect costs literally nothing.
 *   - It self-suspends when the tab is hidden, and does NOT integrate the
 *     dead time on resume (dt is clamped), so a fluid sim doesn't explode
 *     after you come back from another tab.
 *   - dt is clamped to 1/30s. A slow frame under-integrates rather than
 *     taking a huge unstable step — the same tradeoff the original packs
 *     made, applied consistently.
 */

export type TickFn = (dt: number, elapsed: number) => void;

const subscribers = new Set<TickFn>();

let raf = 0;
let last = 0;
let elapsed = 0;
let running = false;

/** Slowest step we'll integrate. Below 30fps we go slow-motion, not unstable. */
const MAX_DT = 1 / 30;

function frame(now: number) {
  raf = requestAnimationFrame(frame);

  const dt = Math.min((now - last) / 1000, MAX_DT);
  last = now;
  elapsed += dt;

  // Iterate a copy: a subscriber is allowed to unsubscribe itself (or
  // another) from inside its own tick without corrupting this pass.
  for (const fn of [...subscribers]) {
    try {
      fn(dt, elapsed);
    } catch (err) {
      // One misbehaving effect must not take down every other effect on the
      // page. Drop it and keep the loop alive.
      subscribers.delete(fn);
      console.error("[ticker] subscriber threw, unsubscribed:", err);
    }
  }
}

function start() {
  if (running) return;
  running = true;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function stop() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(raf);
  raf = 0;
}

function onVisibility() {
  if (document.hidden) {
    stop();
  } else if (subscribers.size > 0) {
    start();
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", onVisibility);
}

/** Subscribe to the frame loop. Returns the unsubscribe function. */
export function subscribe(fn: TickFn): () => void {
  subscribers.add(fn);
  if (!document.hidden) start();

  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}

/** How many effects are currently drawing. Used by the budget guard. */
export function activeCount(): number {
  return subscribers.size;
}
