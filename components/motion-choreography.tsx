"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getReducedMotion } from "@/lib/motion";

/**
 * Phase 2 of the premium-motion rebuild — choreographed scroll.
 *
 * Owns the GSAP ScrollTrigger setup for the hero pinned reveal. The whole
 * #top article is pinned at scroll start; as the user scrolls the next ~100vh
 * the masthead words rise into place with stagger, then the lede block, then
 * the signature footer. Pin releases and the page continues to Selected Work.
 *
 * Mounted once in app/layout.tsx alongside MotionProvider. Reads reduced-motion
 * via getReducedMotion() and bails on true — no pin, no timeline, hero
 * displays at its natural state immediately (matching the editorial-rise
 * fade-in on `<main>` that was already there).
 *
 * Implementation notes:
 *   - gsap.context() scopes the selectors so cleanup is clean on unmount.
 *   - scrub: 1 maps scroll progress 0→1 to timeline progress 0→1 with a
 *     small smoothing window. Not "scrub: true" (instant), which feels jittery
 *     when paired with Lenis interpolation.
 *   - Uses `from` (not `fromTo`) so the natural CSS state is the END state.
 *     If JS fails before this runs, content stays at its visible CSS default.
 *     This is the same fallback discipline the cursor/scroll-progress use.
 *   - The hero is `<article id="top">`; pinning it means `position: fixed`
 *     while the section-rail's IntersectionObserver still tracks correctly
 *     (sections below the pin scroll into view normally).
 */
// REVERT FLAG: set USE_BOOK_STACK = true to bypass this choreography (the
// BookStack scroll-pin owns it instead). false = original scroll-tied hero
// pin and per-section scrubbed reveals are active.
const USE_BOOK_STACK = false;

export function MotionChoreography() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    if (USE_BOOK_STACK) return; // BookStack owns pin + reveals when enabled

    const ctx = gsap.context(() => {
      // ============================================================
      // HERO — pinned scroll-tied reveal
      // The reveal completes over 100vh of scroll. Then pin releases.
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          // Extended from +=100% to +=180% to make room for the intro
          // overlay (`> whoami / abhimanyu_gupta`) to glitch-decay-and-lift
          // BEFORE the masthead decode-reveal begins. Total pin spans
          // ~1.8 viewports of scroll.
          end: "+=180%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      const SCRAMBLE_CHARS =
        "!<>-_\\/[]{}=+*^?#$%&0123456789ABCDEF";

      // ============================================================
      // INTRO EXIT (timeline 0.3 → 0.7) — fade + lift + blur, clean
      // The intro container (prompt + identity together) fades + lifts + blurs
      // out as you scroll. No scramble on the identity — `abhimanyu_gupta`
      // just rides the container's exit so it reads cleanly the whole way.
      // ============================================================
      const introContainer = document.querySelector<HTMLElement>(
        '[data-choreograph="hero-intro"]'
      );

      if (introContainer) {
        tl.to(
          introContainer,
          {
            opacity: 0,
            y: -80,
            filter: "blur(6px)",
            duration: 0.4,
            ease: "expo.in",
          },
          0.3
        );
      }

      // ============================================================
      // MASTHEAD WORDS — entrance (y / opacity / scale) is scrubbed to scroll
      // for the staggered rise. The scramble decode is INDEPENDENT of scroll:
      // when each word's GSAP entrance crosses ~5% progress (the moment it
      // becomes visually present), a one-shot time-based RAF scramble fires
      // and runs at its own pace — matching the ScrambleText component's
      // behavior used throughout the rest of the sections. Once a word has
      // fired its scramble, it never re-fires (no reverse re-scramble).
      // ============================================================
      const mastheadWords = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-choreograph="hero-masthead"] [data-word]'
        )
      );

      // Time-based left-to-right resolve scramble — same pattern as
      // components/scramble-text.tsx, inlined here so the masthead's per-word
      // stagger is owned by GSAP while the decode itself is owned by RAF.
      const runWordScramble = (el: HTMLElement, target: string, duration: number) => {
        const t0 = performance.now();
        const len = target.length;
        const tick = (ts: number) => {
          const t = Math.min(1, (ts - t0) / duration);
          const locked = Math.floor(t * len);
          let out = "";
          for (let j = 0; j < len; j++) {
            if (j < locked) {
              out += target[j];
            } else {
              const c = target[j];
              out +=
                c === " " || c === "\n" || c === "\t"
                  ? c
                  : SCRAMBLE_CHARS[
                      Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                    ];
            }
          }
          el.textContent = out;
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        };
        requestAnimationFrame(tick);
      };

      mastheadWords.forEach((word, i) => {
        const target = word.textContent ?? "";
        let scrambleFired = false;
        tl.from(
          word,
          {
            y: 80,
            opacity: 0,
            scale: 0.92,
            duration: 0.6,
            ease: "expo.out",
            onUpdate: function () {
              if (scrambleFired) return;
              // Fire as soon as the word starts revealing into view — the
              // scramble then plays at its own RAF clock, independent of any
              // further scroll input (forward or reverse).
              if (this.progress() > 0.05) {
                scrambleFired = true;
                runWordScramble(word, target, 700);
              }
            },
          },
          0.5 + i * 0.18
        );
      });

      // Lede block — shifted from 0.7 → 1.3.
      tl.from(
        '[data-choreograph="hero-lede"]',
        {
          y: 40,
          opacity: 0,
          duration: 0.5,
          ease: "expo.out",
        },
        1.3
      );

      // Signature footer — shifted from 1.1 → 1.7.
      tl.from(
        '[data-choreograph="hero-signature"]',
        {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "expo.out",
        },
        1.7
      );

      // ============================================================
      // SELECTED WORK — per-case scroll-tied entry
      // Each case is NOT pinned (would interrupt scroll too aggressively).
      // Instead, each article rises + fades as it enters the viewport, with
      // its meta column and narrative tracking slightly different rates
      // for a subtle parallax effect (the "Podium reveal" reads as two
      // independent columns gliding into place).
      // ============================================================
      gsap.utils
        .toArray<HTMLElement>("#selected-work article")
        .forEach((art) => {
          const meta = art.children[0] as HTMLElement | undefined;
          const narrative = art.children[1] as HTMLElement | undefined;
          if (!meta || !narrative) return;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: art,
                start: "top 85%",
                end: "top 35%",
                scrub: 1,
              },
            })
            .from(
              meta,
              { y: 60, opacity: 0, duration: 1, ease: "expo.out" },
              0
            )
            .from(
              narrative,
              { y: 90, opacity: 0, duration: 1, ease: "expo.out" },
              0.15
            );
        });

      // ============================================================
      // CAPABILITIES — 2×2 atlas cells stagger in on scroll
      // Cells animate based on the section's scroll progress, not on
      // individual cell intersection. Result: all 4 cells animate together
      // as the section comes in, with stagger — composes the atlas.
      // ============================================================
      const capsCells = gsap.utils.toArray<HTMLElement>(
        "#capabilities ol li"
      );
      if (capsCells.length > 0) {
        gsap.from(capsCells, {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: "#capabilities",
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }

      // ============================================================
      // VENTURES — lead/follow pair animate in
      // ============================================================
      const venArticles = gsap.utils.toArray<HTMLElement>(
        "#ventures article"
      );
      if (venArticles.length > 0) {
        gsap.from(venArticles, {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.18,
          scrollTrigger: {
            trigger: "#ventures",
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }

      // ============================================================
      // CONTACT — closing beat: statement → email → footer
      // The terminal section's three layers cascade in on scroll.
      // ============================================================
      const contactStmt = document.querySelector(
        "#contact #contact-heading"
      );
      const contactEmail = document.querySelector(
        '#contact a[href^="mailto:"]'
      );
      const contactFooter = document.querySelector("#contact footer");
      const contactEls = [contactStmt, contactEmail, contactFooter].filter(
        (el): el is HTMLElement => el instanceof HTMLElement
      );
      if (contactEls.length > 0) {
        gsap.from(contactEls, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: "#contact",
            start: "top 75%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }
    });

    // Refresh ScrollTrigger after font load + layout settle. This is the same
    // class of bug that broke Layer 1: web-font swap causes layout shift, which
    // changes pin endpoints. Refresh after fonts.ready (cap at 600 ms so a
    // stalled font load doesn't leave the pin unset forever).
    const refreshAfterFonts = () => ScrollTrigger.refresh();
    if (typeof document.fonts !== "undefined" && document.fonts.ready) {
      const timeout = new Promise<void>((r) => window.setTimeout(r, 600));
      Promise.race([document.fonts.ready.then(() => undefined), timeout]).then(
        refreshAfterFonts
      );
    } else {
      refreshAfterFonts();
    }

    return () => {
      ctx.revert();
    };
  }, []);

  return null;
}
