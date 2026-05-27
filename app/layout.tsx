import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { SectionRail } from "@/components/section-rail";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio",
};

// Inline boot script: set data-theme on <html> synchronously before first
// paint. Priority: localStorage["theme"] (user's explicit toggle choice) →
// OS prefers-color-scheme → dark fallback. Reading storage FIRST is what
// makes the runtime toggle persist across reloads with no flash. A useEffect
// would paint the wrong theme and snap. Raw <script dangerouslySetInnerHTML>
// is the documented App Router pattern for pre-paint inline execution
// (next/script's beforeInteractive does NOT block hydration).
// suppressHydrationWarning on <html> silences the (expected) hydration
// mismatch on the attribute we set client-side.
const themeBootScript = `(function(){try{var s=localStorage.getItem('theme');if(s==='dark'||s==='light'){document.documentElement.setAttribute('data-theme',s);return;}var l=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.setAttribute('data-theme',l?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeToggle />
        <SectionRail />
        {children}
      </body>
    </html>
  );
}
