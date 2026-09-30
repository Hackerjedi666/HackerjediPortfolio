import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { EMAIL, OVERWATCH_URL } from "@/lib/content/site";
import { DottedMap } from "@/components/effects/dotted-map";
import { Highlighter } from "@/components/chrome/highlighter";

/**
 * What I build — the canvas's Builds board, built.
 *
 * The one bone card on a dark panel is web3.forensia, and that placement is
 * the argument: it is the newest thing and the only one a visitor can use
 * without talking to anyone, so it gets the light surface and the live
 * specimen. Everything else stays dark.
 *
 * The specimen matters more than it looks. The card used to describe the
 * product above three numbered step chips, which is an essay about a tool.
 * One truncated address, one hop count and one verdict proves it in about
 * two seconds and costs less height. It is labelled "Sample trace" so it can
 * never be read as a real case.
 */

const OSS = [
  {
    name: "DownBadArena",
    body: "Live Hyperliquid liquidation arena. Leveraged positions fight, health tracks margin risk.",
    stack: "Next.js · Canvas · WebSockets",
  },
  {
    name: "MEV-Gladiator",
    body: "Searcher bots compete in a synthetic mempool and settle on chain, on Monad testnet.",
    stack: "Solidity · Foundry · Bun",
  },
  {
    name: "ReconAutomated",
    body: "Company and target enumeration for pentest recon, minus the repetitive discovery work.",
    stack: "Python",
  },
  {
    name: "NetworkScanner",
    body: "Repeatable host and service discovery for assessments and lab reconnaissance.",
    stack: "Python",
  },
];

const STACK = [
  "Python",
  "TypeScript",
  "Next.js",
  "Solidity",
  "Foundry",
  "Burp Suite",
  "Ghidra",
  "Nessus",
  "SonarQube",
];

const PRACTICE = ["AppSec", "Network", "Red team", "Code review"];

const CARD =
  "flex flex-col rounded-cell border border-hairline bg-panel-hi p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const CHIP =
  "rounded-pill border border-hairline px-4 py-2.5 text-label text-ink-label";

export function Ventures() {
  return (
    <section id="forensia" aria-labelledby="ventures-title" className="section shell">
      <p className="flex items-center gap-3">
        <span aria-hidden="true" className="h-[5px] w-[5px] rounded-pill bg-acid" />
        <span className="text-label text-ink-label">What I build</span>
      </p>
      <h2 id="ventures-title" className="mt-5 text-h2 font-bold">
        Shipped,
        <br />
        not slideware.
      </h2>

      {/* 7/5 — the usable product leads. */}
      <div className="mt-14 grid gap-3 lg:grid-cols-[7fr_5fr]">
        <article className="bone-surface flex flex-col rounded-cell p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="text-label text-ink">web3.forensia.ai</span>
            <span className="flex items-center gap-3 rounded-pill bg-acid px-4 py-2.5 text-label text-acid-ink">
              <span
                aria-hidden="true"
                className="h-[5px] w-[5px] rounded-pill bg-acid-ink"
              />
              Free public beta
            </span>
          </div>

          {/* Real brand artwork, from the product's own Open Graph image.
              Explicit width/height reserves the box before the file loads,
              so nothing shifts underneath it. */}
          <Image
            src="/brand/web3-forensia.webp"
            alt="web3.forensia.ai, the on-chain investigations workspace"
            width={1200}
            height={630}
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="mt-5 w-full rounded-cell border border-hairline object-cover"
          />

          <h3 className="mt-5 text-venture font-bold">
            Blockchain
            <br />
            investigations.
          </h3>
          <p className="mt-5 max-w-[52ch] text-body text-ink-body">
            An <Highlighter action="highlight">evidence first</Highlighter> workspace
            for tracing public on chain activity. Start from one identifier, follow
            the connections, verify the evidence.
          </p>

          {/* A dark inset on the paper card — the tool's own output, shown. */}
          <div className="dark-inset mt-6 rounded-cell p-5">
            <p className="text-label text-ink-label">Sample trace</p>
            <p className="mt-3 flex flex-wrap items-center gap-3">
              {/* tabular-nums so the digits never reflow */}
              <span className="font-mono text-body tabular-nums text-ink">
                0x71C7&hellip;3A90
              </span>
              <ArrowRight
                size={13}
                weight="bold"
                aria-hidden="true"
                className="text-ink-label"
              />
              <span className="text-label text-ink-label">3 hops</span>
              <ArrowRight
                size={13}
                weight="bold"
                aria-hidden="true"
                className="text-ink-label"
              />
              <span className="rounded-pill border border-acid/30 px-4 py-2.5 text-label text-acid">
                Mixer · Tornado Cash
              </span>
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-6">
            <span className="text-label text-ink-label">
              Bitcoin and seven EVM networks · No wallet
            </span>
            <a
              href="https://web3.forensia.ai"
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex min-h-12 items-center gap-3 rounded-pill bg-ink px-6 text-label text-bone"
            >
              Open tool
              <ArrowUpRight
                size={14}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-400 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </article>

        <article className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="text-label text-ink">overwatchlabs.ai</span>
            <span className="flex items-center gap-3 text-label text-ink-label">
              <span
                aria-hidden="true"
                className="h-[5px] w-[5px] rounded-pill bg-ink-label"
              />
              Live
            </span>
          </div>
          <Image
            src="/brand/overwatchlabs.webp"
            alt="OverwatchLabs, the offensive security practice"
            width={1200}
            height={800}
            sizes="(max-width: 1024px) 100vw, 34vw"
            className="mt-5 w-full rounded-cell border border-hairline object-cover"
          />

          <h3 className="mt-5 text-card font-bold">
            Adversary,
            <br />
            by design.
          </h3>
          <p className="mt-5 text-body text-ink-body">
            My offensive security practice. Red teaming, penetration testing and
            source code review that prove exactly how you would be breached.
          </p>
          <div className="mt-auto pt-8">
            <div className="flex flex-wrap gap-2">
              {PRACTICE.map((p) => (
                <span key={p} className={CHIP}>
                  {p}
                </span>
              ))}
            </div>
            {/* The practice card was the only product here with no way in.
                Every card that names a live thing now opens it. */}
            <a
              href={OVERWATCH_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="group mt-6 inline-flex min-h-12 items-center gap-3 rounded-pill border border-line-hi px-6 text-label text-ink transition-colors duration-400 ease-out-expo hover:border-acid hover:text-acid"
            >
              Open the website
              <ArrowUpRight
                size={14}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-400 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </article>
      </div>

      {/* 5/7 — the asymmetry flips, so the page never settles into a rhythm. */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[5fr_7fr]">
        <article className={`${CARD} relative overflow-hidden`}>
          {/* The map is the claim. "Correlates 30+ open and licensed sources"
              is an abstraction until you can see the coverage; the markers
              are the regions those feeds actually report from. Masked and
              held low so it never competes with the copy for contrast. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[62%] text-ink-dim/45 [mask-image:linear-gradient(to_bottom,#000_35%,transparent_92%)]"
          >
            <DottedMap
              markers={[
                { lat: 28.61, lng: 77.21 }, // New Delhi
                { lat: 51.51, lng: -0.13 }, // London
                { lat: 40.71, lng: -74.01 }, // New York
                { lat: 1.35, lng: 103.82 }, // Singapore
                { lat: -33.87, lng: 151.21 }, // Sydney
                { lat: 50.11, lng: 8.68 }, // Frankfurt
                { lat: -23.55, lng: -46.63 }, // Sao Paulo
              ]}
            />
          </span>

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <span className="text-label text-ink">forensia.ai</span>
            <span className="text-label text-ink-label">In maintenance</span>
          </div>
          {/* TODO: forensia.ai product shot, 1200x800.
              forensia.ai publishes no og:image, so there is no real artwork
              to pull. A stock photo here would be worse than none: it would
              imply a product screenshot that is not the product. */}
          <h3 className="relative mt-5 text-card font-bold">
            Threat intel,
            <br />
            one verdict.
          </h3>
          <p className="relative mt-5 text-body text-ink-body">
            <Highlighter action="underline">Built solo.</Highlighter> Correlates 30+
            open and licensed sources into evidence backed verdicts for IPs, domains,
            hashes, CVEs and wallets.
          </p>
          <div className="relative mt-auto grid grid-cols-2 gap-3 pt-8">
            <div>
              <p className="font-display text-stat font-bold text-ink">30+</p>
              <p className="mt-3 text-label text-ink-label">Intel sources</p>
            </div>
            <div>
              <p className="font-display text-stat font-bold text-ink">5</p>
              <p className="mt-3 text-label text-ink-label">Indicator types</p>
            </div>
          </div>
        </article>

        <article className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="text-label text-ink-label">
              Open source and experiments
            </span>
            <a
              href="https://github.com/Hackerjedi666"
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex min-h-11 items-center gap-3 text-label text-ink"
            >
              GitHub
              <ArrowUpRight
                size={14}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-400 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {OSS.map((p) => (
              <div key={p.name} className="rounded-cell bg-cell-hi p-5">
                <p className="text-lead font-semibold text-ink">{p.name}</p>
                <p className="mt-3 text-chip leading-relaxed text-ink-body">{p.body}</p>
                <p className="mt-3 text-label text-ink-dim">{p.stack}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-8 border-t border-hairline pt-10">
        <div>
          <p className="text-label text-ink-label">The stack</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span
                key={t}
                className="rounded-pill border border-hairline px-4 py-2.5 text-chip text-ink"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <a href={`mailto:${EMAIL}`} className="btn btn-acid rounded-pill px-6">
          Start a conversation
        </a>
      </div>
    </section>
  );
}
