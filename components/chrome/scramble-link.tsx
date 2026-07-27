"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const NOISE = "!<>-_\\/[]{}=+*^?#01";

type Props = {
  href: string;
  label: string;
  className?: string;
  onNavigate?: () => void;
};

/**
 * Nav link whose text decodes character-by-character on hover.
 *
 * The visible span is swapped, but an sr-only copy of the real label stays
 * in the accessible name — a screen reader (or a mid-scramble snapshot)
 * never reads garbage. Reduced-motion skips the effect entirely.
 */
export function ScrambleLink({ href, label, className, onNavigate }: Props) {
  const [text, setText] = useState(label);
  const raf = useRef(0);

  const start = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const run = () => {
      const settled = Math.floor(frame / 2);
      if (settled > label.length) {
        setText(label);
        return;
      }
      let out = "";
      for (let i = 0; i < label.length; i++) {
        out +=
          i < settled ? label[i] : NOISE[Math.floor(Math.random() * NOISE.length)];
      }
      setText(out);
      frame++;
      raf.current = requestAnimationFrame(run);
    };
    run();
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    setText(label);
  };

  return (
    <a
      href={href}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      onClick={onNavigate}
      className={cn(
        "text-ink-body transition-colors duration-200 hover:text-acid focus-visible:text-acid",
        className
      )}
    >
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{label}</span>
    </a>
  );
}
