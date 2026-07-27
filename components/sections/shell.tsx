"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BANNER,
  KONAMI,
  PROMPT,
  ROOT_OFF,
  ROOT_ON,
  respond,
} from "@/lib/content/terminal";
import { SectionHead } from "@/components/sections/section-head";

export function Shell() {
  const [lines, setLines] = useState<string[]>(BANNER);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Root mode lives in a ref, not state: the only thing that re-renders on
   *  toggle is the transcript, and the flag itself is never displayed. */
  const rootOn = useRef(false);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const b = bodyRef.current;
      if (b) b.scrollTop = b.scrollHeight;
    });
  }, []);

  const toggleRoot = useCallback(() => {
    const next = !rootOn.current;
    rootOn.current = next;
    document.documentElement.classList.toggle("root-mode", next);
    setLines((l) => l.concat(next ? ROOT_ON : ROOT_OFF));
    inputRef.current?.focus();
    scrollToEnd();
  }, [scrollToEnd]);

  // Konami listener. Lives here (not in a separate provider) because the
  // reward is terminal output — one owner for one easter egg.
  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
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

  const submit = () => {
    const raw = input;
    const out = respond(raw);
    if (out === null) {
      setLines(BANNER);
    } else {
      setLines((l) => l.concat(`${PROMPT} ${raw}`, ...out));
      if (raw.trim()) setHistory((h) => h.concat(raw));
    }
    setInput("");
    setCursor(-1);
    scrollToEnd();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(i);
      setInput(history[i]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor < 0) return;
      const i = cursor + 1;
      if (i >= history.length) {
        setCursor(-1);
        setInput("");
      } else {
        setCursor(i);
        setInput(history[i]);
      }
    }
  };

  return (
    <section id="shell" aria-labelledby="shell-title" className="section shell">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-10">
        <div>
          <SectionHead index="05" label="INTERACTIVE">
            <span id="shell-title">Type at me.</span>
          </SectionHead>

          <p className="mt-5 mb-6 max-w-[42ch] text-body text-ink-body">
            A real shell, not a screenshot. Everything about me is in here
            somewhere — including a flag I&apos;ve hidden. Start with{" "}
            <span className="text-acid">help</span>.
          </p>

          <div className="grid gap-2.5 border border-line-hi bg-panel p-4.5 text-chip leading-[1.8] tracking-normal text-ink-label">
            <span className="tracking-[0.2em] text-ink-body">EASTER EGGS</span>
            <span>↑ ↑ ↓ ↓ ← → ← → B A — konami still works</span>
            <span>
              try <span className="text-acid">sudo su</span>,{" "}
              <span className="text-acid">nmap</span>,{" "}
              <span className="text-acid">flag</span>
            </span>
          </div>
        </div>

        <div
          onClick={() => inputRef.current?.focus()}
          className="reveal relative overflow-hidden border border-acid/25 bg-pit shadow-[0_40px_90px_-50px_rgba(194,255,69,0.25)]"
        >
          <div className="flex items-center gap-2 border-b border-hairline bg-panel px-4 py-3">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#2a2a2a]" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#2a2a2a]" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-acid" />
            <span className="ml-2.5 text-chip tracking-[0.1em] text-ink-label">
              abhimanyu@overwatchlabs — zsh
            </span>
          </div>

          <div
            ref={bodyRef}
            className="h-[440px] overflow-y-auto p-4.5 text-sm"
          >
            <div aria-live="polite" aria-atomic="false">
              {lines.map((line, i) => (
                <p
                  key={`${i}-${line}`}
                  className="whitespace-pre-wrap break-words text-ink-body"
                >
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <span aria-hidden="true" className="text-acid">
                ➜
              </span>
              <span aria-hidden="true" className="text-ink">
                ~
              </span>
              <label htmlFor="shell-input" className="sr-only">
                Terminal input — type a command and press Enter
              </label>
              <input
                id="shell-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-ink outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
