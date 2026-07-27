import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BootSequence } from "@/components/chrome/boot-sequence";
import { Cursor } from "@/components/chrome/cursor";
import { SiteNav } from "@/components/chrome/site-nav";
import { GlobalInk } from "@/components/effects/global-ink";
import { TraceLine } from "@/components/effects/trace-line";
import { META } from "@/lib/content/site";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${META.name} — Offensive Security`,
  description:
    "Red teamer turned founder. Assumed-breach operations against banks, insurers and state platforms — and Forensia, threat intelligence that doesn't drown you.",
  openGraph: {
    title: `${META.name} — Offensive Security`,
    description:
      "Four years of assumed-breach ops. Selected engagements, the anatomy of one op, and a shell you can type into.",
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
      className={`${chakraPetch.variable} ${jetbrainsMono.variable}`}
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

        <SiteNav />
        {children}
      </body>
    </html>
  );
}
