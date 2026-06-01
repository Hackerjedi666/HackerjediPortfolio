"use client";

import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Fixed top-right button (sits to the left of the theme toggle) that flips
 * the whole site between editorial and ROOT MODE (terminal green-on-black).
 *
 * State is the html.root-mode class, not local useState — so this stays in
 * sync with the other entry points that also toggle root mode (the Konami
 * code listener in components/root-mode.tsx). MutationObserver on
 * documentElement.class keeps the button's `aria-pressed` accurate when
 * other code toggles the class.
 */
export function RootModeToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActive(document.documentElement.classList.contains("root-mode"));

    const obs = new MutationObserver(() => {
      setActive(document.documentElement.classList.contains("root-mode"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    document.documentElement.classList.toggle("root-mode");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Exit ROOT MODE" : "Enter ROOT MODE"}
      aria-pressed={active}
      title={active ? "Exit ROOT MODE" : "Enter ROOT MODE"}
      className="
        group fixed right-[5rem] top-3u z-50
        flex h-5u w-5u items-center justify-center
        rounded-full border border-rule bg-paper-deep
        text-ink-mute
        hover:border-accent hover:text-ink
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        aria-pressed:border-accent aria-pressed:text-accent
      "
    >
      <Terminal className="h-3u w-3u" aria-hidden="true" />
    </button>
  );
}
