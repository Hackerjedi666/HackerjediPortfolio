"use client";

import { useEffect, useRef, useState } from "react";

const LINES = ["whoami", "ls -la ./ops", "cat flag.txt", "nmap -sV --top-ports"];

/**
 * A live prompt on the shell tile.
 *
 * The tile used to say "a real shell, not a screenshot" above an empty black
 * rectangle, which is the exact thing it was claiming not to be. This types a
 * command, holds, clears, and moves to the next one, so the claim is visible
 * from the grid instead of being taken on trust.
 *
 * Typing is driven by one `setTimeout` chain rather than an interval: an
 * interval keeps firing while the tab is backgrounded and then replays every
 * missed tick at once when it returns, which looks like a seizure. A chain
 * simply pauses.
 */
export function ShellTease() {
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Respect a stated preference for stillness: show one command, no typing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(LINES[0]);
      return;
    }

    let line = 0;
    let char = 0;
    let erasing = false;

    const tick = () => {
      const target = LINES[line];
      if (!erasing) {
        char++;
        setText(target.slice(0, char));
        if (char === target.length) {
          erasing = true;
          timer.current = setTimeout(tick, 1400);
          return;
        }
        // Uneven cadence. A fixed delay per character reads as a machine
        // printing; real typing has jitter.
        timer.current = setTimeout(tick, 55 + Math.random() * 70);
        return;
      }
      char--;
      setText(target.slice(0, char));
      if (char === 0) {
        erasing = false;
        line = (line + 1) % LINES.length;
        timer.current = setTimeout(tick, 400);
        return;
      }
      timer.current = setTimeout(tick, 26);
    };

    timer.current = setTimeout(tick, 700);
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 top-auto block px-[clamp(1.5rem,2.6vw,2.25rem)] pb-[clamp(1.5rem,2.6vw,2.25rem)]">
      <span className="flex items-center gap-2 font-mono text-chip text-ink-dim">
        <span className="text-acid">$</span>
        <span className="truncate">{text}</span>
        <span className="shell-caret" />
      </span>
    </span>
  );
}
