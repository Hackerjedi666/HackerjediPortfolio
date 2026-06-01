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
export function MotionChoreography() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;

    const ctx = gsap.context(() => {
      // ============================================================
      // HERO — pinned scroll-tied reveal
      // The reveal completes over 100vh of scroll. Then pin releases.
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "+=100%",
          pin: true,
          // pinSpacing default true: adds a spacer below the pinned hero so
          // total document height accounts for the pinned distance. Without
          // it, sections below would overlap the hero during the pin.
          scrub: 1,
          // anticipatePin smooths the entry into pin from an upward scroll.
          anticipatePin: 1,
        },
      });

      // Masthead words rise + DECODE (per-word scramble tied to each word's
      // GSAP progress). Each word gets its own tween so onUpdate fires
      // per-element. As user scrolls, scroll progress → tween progress →
      // scramble resolve fraction. The hacker decode happens IN-SYNC with the
      // rise; by the time the word is fully visible it's also fully decoded.
      const SCRAMBLE_CHARS =
        "!<>-_\\/[]{}=+*^?#$%&0123456789ABCDEF";
      const mastheadWords = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-choreograph="hero-masthead"] [data-word]'
        )
      );
      mastheadWords.forEach((word, i) => {
        const target = word.textContent ?? "";
        tl.from(
          word,
          {
            y: 80,
            opacity: 0,
            scale: 0.92,
            duration: 0.6,
            ease: "expo.out",
            onUpdate: function () {
              const p = this.progress();
              if (p >= 1) {
                word.textContent = target;
                return;
              }
              let out = "";
              for (let j = 0; j < target.length; j++) {
                if (Math.random() < p) {
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
              word.textContent = out;
            },
            onComplete: () => {
              word.textContent = target;
            },
          },
          i * 0.18
        );
      });

      // Lede block follows the masthead in by ~50% of the timeline.
      tl.from(
        '[data-choreograph="hero-lede"]',
        {
          y: 40,
          opacity: 0,
          duration: 0.5,
          ease: "expo.out",
        },
        0.7
      );

      // Signature footer last — caps the cascade.
      tl.from(
        '[data-choreograph="hero-signature"]',
        {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "expo.out",
        },
        1.1
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
