import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** "01" — the section's number in the running order. */
  index: string;
  /** "SELECTED OPS" — the eyebrow's own words. */
  label: string;
  /** Acid eyebrow (default) or plain ink, alternating down the page so the
   *  accent never becomes wallpaper. */
  tone?: "acid" | "ink";
  children: ReactNode;
  lede?: ReactNode;
  className?: string;
};

export function SectionHead({
  index,
  label,
  tone = "acid",
  children,
  lede,
  className,
}: Props) {
  return (
    <header className={className}>
      <p
        className={cn(
          "eyebrow reveal-sm text-label tracking-[0.26em]",
          tone === "acid" ? "text-acid" : "text-ink"
        )}
      >
        {index} {"//"} {label}
      </p>
      <h2 className="reveal mt-7 text-h2 uppercase">{children}</h2>
      {lede ? (
        <p className="reveal-fade mt-5 max-w-[56ch] text-body text-ink-body">{lede}</p>
      ) : null}
    </header>
  );
}
