import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional. Section numbers are only earned when the sequence itself is
   *  information the reader needs; on this site it never was, so most
   *  sections omit it and the label stands alone. */
  index?: string;
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
          "eyebrow reveal-sm text-label",
          tone === "acid" ? "text-acid" : "text-ink"
        )}
      >
        {index ? `${index} // ` : ""}
        {label}
      </p>
      <h2 className="reveal mt-7 text-h2 font-bold">{children}</h2>
      {lede ? (
        <p className="reveal-fade mt-5 max-w-[56ch] text-body text-ink-body">{lede}</p>
      ) : null}
    </header>
  );
}
