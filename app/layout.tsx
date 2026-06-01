import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SectionRail } from "@/components/section-rail";
import { MotionProvider } from "@/components/motion-provider";
import { MotionChoreography } from "@/components/motion-choreography";
import { HeroCanvas } from "@/components/hero-canvas";
import { Cursor } from "@/components/cursor";
import { ScrollProgress } from "@/components/scroll-progress";
import { RootMode } from "@/components/root-mode";
import { RootModeToggle } from "@/components/root-mode-toggle";
import { IntrusionLog } from "@/components/intrusion-log";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <HeroCanvas />
        <MotionProvider />
        <MotionChoreography />
        <RootMode />
        <ScrollProgress />
        <Cursor />
        <RootModeToggle />
        <SectionRail />
        <IntrusionLog />
        {children}
      </body>
    </html>
  );
}
