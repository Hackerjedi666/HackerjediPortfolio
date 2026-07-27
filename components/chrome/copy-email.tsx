"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy-to-clipboard for the footer address.
 *
 * The address above it is drawn on a canvas, so it can't be selected or
 * clicked. Without this there'd be no way to actually take the email off the
 * page — which would make the effect cost more than it's worth.
 */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the address is still in the page source */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="mb-9 inline-flex min-h-11 items-center gap-2.5 py-2 text-micro tracking-[0.16em] text-ink-label transition-colors hover:text-acid"
    >
      {copied ? (
        <Check size={13} strokeWidth={1.75} aria-hidden="true" className="text-acid" />
      ) : (
        <Copy size={13} strokeWidth={1.75} aria-hidden="true" />
      )}
      {/* aria-live so the confirmation is announced, not just shown. */}
      <span aria-live="polite">{copied ? "COPIED TO CLIPBOARD" : "COPY EMAIL ADDRESS"}</span>
    </button>
  );
}
