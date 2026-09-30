"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  href: string;
  /** Shown in the card that follows the cursor. */
  description: string;
  /** Small label above the description — a topic, a date, a kind. */
  kicker?: string;
  external?: boolean;
  className?: string;
};

/**
 * A link that opens a small card under the cursor while hovered.
 *
 * Ported from VengeanceUI's `cursor-card`. Three things had to change:
 *
 *   1. It needed `framer-motion` for a spring. The follow here is a lerp in
 *      one rAF loop writing `style.transform` directly — no dependency, and
 *      no re-render per pointer move.
 *   2. It required an `image` per card. There are no such assets in this
 *      project, and a placeholder rectangle is worse than no image, so the
 *      card carries a kicker and a sentence instead.
 *   3. `hover:bg-orange-100 dark:hover:bg-orange-900/40` and white card
 *      surfaces became tokens — this is a single committed dark theme.
 *
 * The card is `pointer-events-none` and `aria-hidden`: it is a preview of
 * where the link goes, and a screen reader already has the link text plus
 * the description as its accessible name.
 */
export function CursorCard({
  children,
  href,
  description,
  kicker,
  external = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  // No `mounted` guard is needed for the portal: `open` can only become true
  // from a pointer event, which never happens during SSR or the first paint.
  // The usual useEffect(() => setMounted(true)) dance triggers a cascading
  // render for nothing.
  useEffect(() => {
    if (!open) return;
    // Trailing follow. Starting from the current pointer position rather than
    // 0,0 stops the card flying in from the top-left on first hover.
    pos.current = { ...target.current };
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      const el = cardRef.current;
      if (el) {
        el.style.transform = `translate3d(${pos.current.x.toFixed(1)}px, ${pos.current.y.toFixed(1)}px, 0)`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [open]);

  const onMove = (e: React.MouseEvent) => {
    target.current = { x: e.clientX - 130, y: e.clientY + 22 };
  };

  return (
    <>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        onMouseEnter={onMove}
        onMouseMove={onMove}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(false)}
        aria-label={`${children as string}: ${description}`}
        className={cn(
          "group inline-flex items-baseline gap-3 text-ink transition-colors duration-400 ease-out-expo hover:text-acid",
          className
        )}
      >
        {children}
      </a>

      {open
        ? createPortal(
            <div
              ref={cardRef}
              aria-hidden="true"
              className="pointer-events-none fixed left-0 top-0 z-[240] w-[260px] rounded-cell border border-line-hi bg-panel p-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)]"
            >
              {kicker ? (
                <p className="text-label text-acid">{kicker}</p>
              ) : null}
              <p className="mt-2 text-chip leading-relaxed text-ink-body">
                {description}
              </p>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
