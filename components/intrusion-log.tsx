"use client";

import { useEffect, useState } from "react";
import { getReducedMotion } from "@/lib/motion";

// Plausible offensive-security activity lines — drawn from real toolchains
// (nmap, smbclient, BloodHound, mimikatz, Burp). NOT fake "hax0r" tropes.
// The point is it reads as something a real red teamer would tail in their
// terminal during an engagement, not Hollywood.
const LOG_LINES: ReadonlyArray<string> = [
  "scanned 10.0.0.0/24 — 27 hosts up, 4 with SMB",
  "enumerated shares on DC01 — 12 found, 3 readable",
  "BloodHound ingestion: 1840 objects, 4 attack paths",
  "kerberoasted CIFS/svc_backup — TGS captured",
  "EDR signature dropped — payload.dll executed in memory",
  "phishlet armed — credential capture proxy live",
  "C2 beacon dwelling — sleep 4200s ± jitter",
  "discovered GPP cpassword in SYSVOL — decoded OK",
  "passed-the-hash CIFS\\\\admin@FILE01 — system",
  "DCSync krbtgt — golden ticket forgable",
  "exfil chunked via DNS-over-HTTPS — 14KB sent",
  "extracted lsass — 9 cleartext credentials",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nowStamp() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Bottom-right corner mono-caption log that emits 3-4 plausible pentest
 * activity lines, holds for a beat, fades out, then repeats after ~90 s.
 * Pure flavor — quietly signals "an operator is using this site."
 *
 * - First emission delayed ~6s after mount (lets the hero land first).
 * - Each line types in for ~600ms, holds ~3s, fades.
 * - Reduced-motion: returns null (no log, no motion).
 * - Hidden on mobile (no horizontal room without crowding content).
 */
export function IntrusionLog() {
  const [lines, setLines] = useState<Array<{ id: number; text: string }>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    // Hide on touch / small screens — there's no spare bottom-right real estate.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    if (coarse || narrow) return;

    let id = 0;
    let active = true;
    const timeouts: number[] = [];
    const setT = (fn: () => void, ms: number) => {
      const t = window.setTimeout(fn, ms);
      timeouts.push(t);
      return t;
    };

    const emit = () => {
      // 3-4 lines per burst
      const count = 3 + Math.floor(Math.random() * 2);
      const picked: number[] = [];
      while (picked.length < count) {
        const i = Math.floor(Math.random() * LOG_LINES.length);
        if (!picked.includes(i)) picked.push(i);
      }
      const stagger = 850; // ms between line additions
      const hold = 3200; // ms after last line before fade
      picked.forEach((i, idx) => {
        setT(() => {
          if (!active) return;
          const text = `[${nowStamp()}] ${LOG_LINES[i]}`;
          setLines((prev) => [...prev, { id: id++, text }]);
        }, idx * stagger);
      });
      setT(() => {
        if (!active) return;
        setLines([]);
      }, picked.length * stagger + hold);
      // Schedule next burst
      setT(emit, picked.length * stagger + hold + 60_000);
    };

    setT(emit, 6000);

    return () => {
      active = false;
      timeouts.forEach(window.clearTimeout);
    };
  }, []);

  if (lines.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3u right-3u z-40 hidden flex-col items-end gap-y-1u md:flex"
    >
      {lines.map((l) => (
        <p
          key={l.id}
          className="intrusion-log-line max-w-[60ch] truncate font-mono text-body-sm uppercase tracking-wide text-ink-mute"
        >
          {l.text}
        </p>
      ))}
    </div>
  );
}
