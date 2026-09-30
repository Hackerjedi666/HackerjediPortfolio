"use client";

import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Milliseconds for one full cycle. */
  durationMs?: number;
};

/**
 * Kinetic wordmark — letters that stretch and bounce on a loop.
 *
 * Ported from VengeanceUI's `kinetic-text-loader`. Five things had to change
 * before it could be used here, and the first two were bugs:
 *
 *   1. It injected `<style>` with `@import url(Roboto)` INSIDE the component
 *      body. An `@import` that follows other rules is invalid CSS and is
 *      dropped, so the font it depends on never actually loaded — it was
 *      silently falling back to the platform sans. The keyframes now live in
 *      globals.css, defined once instead of per instance.
 *   2. The animation was hardcoded to the word "Loading": it only animated
 *      index 0 if the character was `L`, and index 4 if it was `i`. Any other
 *      word rendered completely static. Here the animated letters are derived
 *      from the word's own length, so it works on anything.
 *   3. Roboto is a banned face on this project and would have been a fourth
 *      font family. It uses the display token.
 *   4. `text-neutral-800 dark:text-neutral-200` became a token, since this is
 *      a single committed dark theme.
 *   5. The dot that orbited the word is gone. On a loader it reads as
 *      progress; on a wordmark it is a bouncing ball next to a name.
 */
export function KineticText({ text, className, durationMs = 1800 }: Props) {
  const letters = [...text];
  // Two moving letters, spaced apart, derived rather than hardcoded. More
  // than two and the word stops being readable while it animates.
  const bounceAt = 0;
  const stretchAt = Math.min(letters.length - 1, Math.max(2, Math.floor(letters.length / 2)));

  return (
    <span
      aria-label={text}
      role="img"
      className={cn(
        "kinetic-text inline-flex select-none font-display font-bold",
        className
      )}
      style={{ ["--ktl-dur" as string]: `${durationMs}ms` }}
    >
      {letters.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "inline-block",
            i === bounceAt && "kinetic-bounce",
            i === stretchAt && "kinetic-stretch"
          )}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
