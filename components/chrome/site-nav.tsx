"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ScrambleLink } from "@/components/chrome/scramble-link";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { NavPreview } from "@/components/chrome/nav-preview";
import { FORENSIA_URL } from "@/lib/content/site";

const LINKS = [
  { href: "#ops", label: "OPS" },
  { href: "#anatomy", label: "ANATOMY" },
  { href: "#stack", label: "STACK" },
  { href: "#forensia", label: "LABS" },
  { href: "#shell", label: "SHELL" },
  { href: "#research", label: "RESEARCH" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Short delay before opening so that sweeping the cursor across the rail on
  // the way somewhere else doesn't strobe six full-screen panels. Leaving
  // cancels immediately — closing should always feel instant.
  const armPreview = (id: string) => {
    clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => setPreview(id), 90);
  };
  const clearPreview = () => {
    clearTimeout(enterTimer.current);
    setPreview(null);
  };

  useEffect(() => () => clearTimeout(enterTimer.current), []);

  // Lock the page behind the mobile sheet, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <NavPreview activeId={preview} />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-6 border-b border-hairline bg-void/78 px-gutter py-3.5 backdrop-blur-[14px] backdrop-saturate-150"
      >
        <a
          href="#top"
          aria-label="Back to top"
          className="-my-2 -ml-2 flex min-h-11 items-center gap-2.5 py-2 pl-2 text-ink"
        >
          <span className="grid h-[30px] w-[30px] flex-none place-items-center border border-acid font-display text-[13px] font-bold text-acid">
            AG
          </span>
          <span className="text-label text-ink-label">HACKERJEDI</span>
        </a>

        {/* Desktop rail. Hovering a link opens its preview; leaving the whole
            rail closes, so moving between links crossfades rather than
            flickering through the closed state. */}
        <div
          className="hidden items-center gap-[18px] text-label lg:flex"
          onPointerLeave={clearPreview}
        >
          {LINKS.map((l) => (
            <span
              key={l.href}
              onPointerEnter={() => armPreview(l.href.slice(1))}
              onFocus={() => armPreview(l.href.slice(1))}
              onBlur={clearPreview}
            >
              <ScrambleLink href={l.href} label={l.label} onNavigate={clearPreview} />
            </span>
          ))}
          <MagneticLink
            href={FORENSIA_URL}
            external
            className="bg-acid px-4 py-2.5 text-label font-bold tracking-[0.14em] whitespace-nowrap text-acid-ink hover:shadow-[0_8px_30px_rgba(194,255,69,0.22)] transition-shadow"
          >
            TRY FORENSIA
          </MagneticLink>
        </div>

        {/* Mobile trigger — 44px target, per touch guidance */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 grid h-11 w-11 place-items-center text-ink-body transition-colors hover:text-acid lg:hidden"
        >
          <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-[95] flex flex-col bg-void/97 backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-center justify-between px-gutter py-3.5">
          <span className="text-label text-ink-label">NAVIGATION</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="-mr-2 grid h-11 w-11 place-items-center text-ink transition-colors hover:text-acid"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-1 px-gutter pb-24">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 border-b border-hairline py-4 font-display text-[clamp(28px,9vw,44px)] font-bold uppercase leading-none text-ink transition-colors hover:text-acid"
            >
              <span className="font-mono text-micro text-acid">
                {String(i + 1).padStart(2, "0")}
              </span>
              {l.label}
            </a>
          ))}
          <a
            href={FORENSIA_URL}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setOpen(false)}
            className="mt-8 grid min-h-12 place-items-center bg-acid px-6 text-label font-bold tracking-[0.14em] text-acid-ink"
          >
            TRY FORENSIA
          </a>
        </div>
      </div>
    </>
  );
}
