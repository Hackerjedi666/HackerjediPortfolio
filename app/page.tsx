import { Hero } from "@/components/sections/hero";
import { Ops } from "@/components/sections/ops";
import { Anatomy } from "@/components/sections/anatomy";
import { Stack } from "@/components/sections/stack";
import { Ventures } from "@/components/sections/ventures";
import { Shell } from "@/components/sections/shell";
import { Research } from "@/components/sections/research";
import { SiteFooter } from "@/components/sections/site-footer";

/**
 * Running order — claim, proof, method, capability, product, play, output,
 * contact. Every section is a server component except the shell, which owns
 * the terminal's state and the konami listener.
 */
export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Ops />
        <Anatomy />
        <Stack />
        <Ventures />
        <Shell />
        <Research />
      </main>
      <SiteFooter />
    </>
  );
}
