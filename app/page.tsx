import { BentoHome } from "@/components/bento/bento-home";
import { HeroLead } from "@/components/sections/hero-lead";
import { HoodieDev } from "@/components/effects/hoodie-dev";
import { BinaryRain } from "@/components/effects/binary-rain";
import { TweetCard } from "@/components/effects/tweet-card";
import { AutoScrollColumn } from "@/components/effects/auto-scroll-column";
import { ShellTease } from "@/components/bento/shell-tease";
import {
  ClientCycler,
  ChainStepper,
  AddressTrace,
} from "@/components/bento/tile-live";
import { ToolMarquee, CareerRule } from "@/components/bento/tile-marquee";
import { Particles } from "@/components/effects/particles";
import { Ops } from "@/components/sections/ops";
import { Stack } from "@/components/sections/stack";
import { Ventures } from "@/components/sections/ventures";
import { Shell } from "@/components/sections/shell";
import { Research } from "@/components/sections/research";
import { About } from "@/components/sections/about";
import { Cve } from "@/components/sections/cve";
import { SiteFooter } from "@/components/sections/site-footer";

/**
 * The landing view is a bento grid, not a scroll.
 *
 * Every section still exists and is unchanged; each one is now revealed by
 * the tile that describes it rather than stacked below the last. They are
 * passed to <BentoHome> as already-rendered server output, so the grid's
 * click handling is the only thing that ships as client JavaScript — the
 * ops, anatomy, stack, ventures and research content stays on the server.
 *
 * <Shell> is the exception and always was: it owns the terminal's state and
 * the konami listener, so it is a client component in its own right.
 */
export default function Home() {
  return (
    <>
      <main>
        {/* The hero is a band, not a cell. Everything below it is still the
            grid; the contrast between the two is the hierarchy. */}
        <HeroLead
          aside={
            /* He points at the tweet, so the tweet has to be next to him.
               The featured card came out of the hero when the character
               went in; this puts it back as the thing he is gesturing at. */
            <div className="hero-duo">
              <HoodieDev says="read about me">
                <BinaryRain />
              </HoodieDev>
              <TweetCard size="lg" id="2043671335914864963" className="hero-featured-tweet" />
            </div>
          }
        />

        <BentoHome
          /* The work itself, on the first viewport. These already existed in
             the codebase and were the most interesting things in it; they
             were sitting below the fold or behind a click. */
          media={{
            shell: <ShellTease />,
            /* Particles drift and pull toward the cursor — notes scattering
               on a desk, for the tile that collects writing. */
            research: (
              <Particles
                className="absolute inset-0"
                quantity={70}
                ease={70}
                size={0.5}
                staticity={38}
                color="#c7f23a"
              />
            ),
          }}
          /* Full-strength content over a tile, outside the dimmed media layer. */
          overlay={{
            /* Five tweets in a column that drifts and leans with scroll
               velocity. Fetched at build like the featured one, so the tile
               costs the visitor no syndication requests. */
            signals: (
              <AutoScrollColumn
                /* Stops above the tile's own heading. At bottom-4 the column
                   ran under "Thinking / out loud." and the two sets of words
                   sat on top of each other; 7.5rem is the heading plus its
                   leading, so the drift now ends where the copy begins. */
                className="absolute inset-x-4 bottom-[7.5rem] top-[4.25rem]"
                speed={0.3}
              >
                {[
                  "2103443544421916824",
                  "2054515416253521921",
                  "2048067199760572740",
                  "2045464099564457993",
                  "2044310777306460439",
                  "2021919926093746508",
                  "2015164373984272525",
                ].map((id) => (
                  <TweetCard key={id} id={id} />
                ))}
              </AutoScrollColumn>
            ),

            /* Five tiles that were inert now animate the thing they are
               about. Each is pinned to the top of its tile because the
               overlay layer sits above the copy, and the copy is anchored
               to the bottom. */
            ops: <ClientCycler />,
            published: <ChainStepper />,
            stack: <ToolMarquee />,
            about: <CareerRule />,
          }}
          details={{ forensia: <AddressTrace /> }}
          panels={{
            ops: <Ops />,
            stack: <Stack />,
            forensia: <Ventures />,
            shell: <Shell />,
            research: <Research />,
            about: <About />,
            published: <Cve />,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
