"use client";

import { useEffect, useState } from "react";

/**
 * Session clock in the hero status line. Renders empty on the server and on
 * first paint — the viewer's wall clock is not knowable at build time, and
 * guessing it would be a hydration mismatch on every load.
 */
export function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const d = new Date();
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span suppressHydrationWarning className="tabular-nums">
      {time}
    </span>
  );
}
