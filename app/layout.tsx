import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Space_Grotesk, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/components/chrome/smooth-scroll";
import { BootSequence } from "@/components/chrome/boot-sequence";
import { Cursor } from "@/components/chrome/cursor";
import { GlobalInk } from "@/components/effects/global-ink";
import { TraceLine } from "@/components/effects/trace-line";
import { META } from "@/lib/content/site";

// Three voices, each with one job. Space Grotesk runs at its natural
// width — the previous build condensed every headline to 86%, and a width
// axis pulled tight is the first thing legibility loses.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  // 300 and 400 exist only for the kinetic email treatment, which
  // interpolates weight on hover and needs somewhere to start from.
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Body voice. Mono used to carry the whole page, which reads as a tool
// rather than a practice; it is now confined to data and labels.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  /* Required for the generated OG card to resolve to an absolute URL.
     Without it Next warns at build and crawlers get a relative src, which
     most of them simply drop — the card would silently not appear. */
  metadataBase: new URL("https://rubberduckypro.com"),
  title: `${META.name} · Offensive Security`,
  description:
    "Red teamer turned founder. Assumed-breach operations against banks, insurers and state platforms, and Forensia: threat intelligence that doesn't drown you.",
  openGraph: {
    title: `${META.name} · Offensive Security`,
    description:
      "Assumed-breach operations against banks, insurers and state platforms. Selected engagements, a published CVE, and a terminal you can type into.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {/* Runs before first paint: on a repeat view within the same session
            the boot curtain is suppressed so it never flashes.

            This injects a <style> rather than adding a class to <html>.
            A class would be a pre-hydration mutation of a React-rendered
            element, which React reports as a hydration mismatch on every
            repeat load; a style tag appended to <head> isn't part of React's
            tree, so it achieves the same pre-paint suppression silently. */}
        <Script id="hj-boot-skip" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem('hj_boot')==='1'){var s=document.createElement('style');s.textContent='.boot{display:none!important}';document.head.appendChild(s)}}catch(e){}`}
        </Script>

        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:bg-acid focus:px-4 focus:py-3 focus:text-label focus:font-bold focus:text-acid-ink"
        >
          Skip to content
        </a>

        <BootSequence />
        <SmoothScroll />

        {/* The page's living backdrop: a single viewport-wide ink fluid that
            the pointer pushes through, sitting at z-0 behind every section. */}
        <GlobalInk />

        {/* One continuous acid trace drawn down the whole document as you
            scroll, with a lit node at its head. */}
        <TraceLine />
        <Cursor />

        {/* Document scroll progress — one scroll-driven CSS animation. */}
        <div
          aria-hidden="true"
          className="scroll-grow fixed inset-x-0 top-0 z-[90] h-0.5 bg-[linear-gradient(90deg,var(--color-acid),#556b1f)]"
        />

        {children}
      </body>
    </html>
  );
}
