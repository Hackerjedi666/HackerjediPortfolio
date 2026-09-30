"use client";

import { useCallback, useEffect, useRef } from "react";
import { KONAMI } from "@/lib/content/terminal";
import { SectionHead } from "@/components/sections/section-head";
import { ContactTerminal } from "@/components/sections/contact-terminal";

/**
 * The Interactive section.
 *
 * This used to be a toy shell with `help` / `nmap` / `flag` commands. It is
 * now a contact form in the same terminal costume, because the tile was the
 * most engaging thing on the page and pointed nowhere — a visitor who liked
 * it had nothing to do next.
 *
 * The konami easter egg survives the change. It never belonged to the
 * terminal: it toggles a class on the document root, so it works anywhere on
 * the page and costs one listener.
 */
export function Shell() {
  const rootOn = useRef(false);

  const toggleRoot = useCallback(() => {
    rootOn.current = !rootOn.current;
    document.documentElement.classList.toggle("root-mode", rootOn.current);
  }, []);

  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      // Ignore the sequence while someone is typing into the form, or an
      // answer containing "b" then "a" would trip it.
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buffer = buffer.concat(key).slice(-KONAMI.length);
      if (buffer.join(",") === KONAMI.join(",")) {
        buffer = [];
        toggleRoot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRoot]);

  // Root mode is a document-level class; make sure it doesn't outlive the page.
  useEffect(() => () => document.documentElement.classList.remove("root-mode"), []);

  return (
    <section id="shell" aria-labelledby="shell-title" className="section shell">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-10">
        <div>
          <SectionHead label="INTERACTIVE" tone="ink">
            <span id="shell-title">Type at me.</span>
          </SectionHead>

          <p className="mt-5 mb-6 max-w-[46ch] text-body text-ink-body">
            Three questions, one at a time, and it lands in my inbox. Red
            teaming, application security, or a second opinion on an
            architecture. Whatever it is, start here.
          </p>

          <div className="grid gap-2.5 rounded-cell border border-hairline bg-panel p-5 text-chip leading-[1.8] text-ink-label">
            <span className="text-label text-ink-body">WHAT HAPPENS NEXT</span>
            <span>I read everything that arrives. Replies come from a human.</span>
            <span>
              Prefer mail?{" "}
              <a
                href="mailto:abhimanyu.gupta@overwatchlabs.ai"
                className="text-acid hover:text-ink"
              >
                abhimanyu.gupta@overwatchlabs.ai
              </a>
            </span>
          </div>
        </div>

        <ContactTerminal />
      </div>
    </section>
  );
}
