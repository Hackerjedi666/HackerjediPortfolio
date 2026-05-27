import { PORTFOLIO_DATA, type VentureStatus } from "@/lib/content/portfolio-data";
import { isPlaceholder } from "@/lib/utils";

// Single source for the mono status label. Record over the full VentureStatus
// union so any new status added in data forces an entry here at compile time.
const STATUS_LABEL: Record<VentureStatus, string> = {
  active: "Active",
  building: "Building",
  launching: "Launching",
  launched: "Launched",
};

export function Ventures() {
  const ventures = PORTFOLIO_DATA.ventures;
  const total = ventures.length;
  // Eyebrow grammar parallels the other sections — small register count, mono.
  const eyebrow = `Ventures / 001–${String(total).padStart(3, "0")}`;
  const overwatch = ventures.find((v) => v.id === "overwatch-labs");
  const forensia = ventures.find((v) => v.id === "forensia");
  const contactEmail = PORTFOLIO_DATA.meta.email;

  if (!overwatch || !forensia) return null;

  return (
    <section
      id="ventures"
      aria-labelledby="ventures-heading"
      className="px-3u py-18u md:px-8u"
    >
      {/* Section header — same eyebrow + h2 grammar as the rest. The lede is
          the connective device: a single sentence that names the relationship
          between the two ventures as a founder narrative (practice + product
          spun out of the practice), so the two blocks below read as related,
          not as a flat pair of logos. */}
      <div className="grid grid-cols-12 gap-x-3u">
        <header className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-mono text-caption uppercase text-ink-mute">{eyebrow}</p>
          <h2
            id="ventures-heading"
            className="mt-3u font-serif text-h2 text-balance text-ink"
          >
            Ventures
          </h2>
          <p className="mt-5u max-w-[60ch] font-serif text-lede text-ink-soft">
            The practice today; the product it&rsquo;s becoming.{" "}
            {overwatch.name} is the operating offensive-security practice —{" "}
            {forensia.name.split(" ")[0]} is its core threat-intel capability,
            being turned into a buyable platform.
          </p>
        </header>
      </div>

      {/* Lead / follow pair — OverwatchLabs (7 sub-cols, text-h2 title) +
          Forensia (5 sub-cols, text-lede title). Side-by-side at md+, stacked
          at mobile. The asymmetric split + the title-size step from h2 (36 px)
          to lede (21 px) does the lead/follow work without a new accent.
          This is the fifth distinct rhythm on the page: not vertical dossier
          rows (Selected Work), not a tight ruled ledger (Open Source), not a
          2×2 equal-weight atlas (Capabilities), but a single horizontal lead-
          and-follow pair — two different entities held at unequal weight in
          the same row, the only place on the page where that happens. */}
      <div className="mt-12u grid grid-cols-12 gap-x-3u md:mt-18u">
        <div className="col-span-12 flex flex-col gap-y-12u md:col-span-9 md:col-start-3 md:grid md:grid-cols-12 md:gap-x-3u md:gap-y-0">
          {/* LEAD — OverwatchLabs. Quiet status (mono caption, ink-mute) since
              an ongoing practice is a steady state, not news. Email is the
              concrete affordance — you can actually engage. */}
          <article className="md:col-span-7">
            <p className="font-mono text-caption uppercase text-ink-mute">
              {STATUS_LABEL[overwatch.status]}&nbsp;&nbsp;·&nbsp;&nbsp;Independent practice
            </p>
            <h3 className="mt-3u font-serif text-h2 text-balance text-ink">
              {overwatch.name}
            </h3>
            <p className="mt-5u font-serif text-body text-ink-soft">
              {overwatch.description}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-5u inline-block font-mono text-caption uppercase text-ink-mute underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-accent"
            >
              {contactEmail}&nbsp;↗
            </a>
          </article>

          {/* FOLLOW — Forensia. The status word LAUNCHING sits in full ink
              (not ink-mute) so it reads louder than OverwatchLabs' steady
              "Active" — newsworthy "near, not yet." The trailing qualifier
              stays in ink-mute so the eye still anchors on the status word.
              No accent — visibility from ink-strength contrast within the
              mono caption, consistent with how the disclosure block in
              Selected Work uses ink-strength for emphasis. */}
          <article className="md:col-span-5">
            <p className="font-mono text-caption uppercase">
              <span className="text-ink">{STATUS_LABEL[forensia.status]}</span>
              <span className="text-ink-mute">
                &nbsp;&nbsp;·&nbsp;&nbsp;Buyable platform coming
              </span>
            </p>
            <h3 className="mt-3u font-serif text-lede text-balance text-ink">
              {forensia.name}
            </h3>
            <p className="mt-5u font-serif text-body text-ink-soft">
              {forensia.description}
            </p>

            {/* Buy affordance — gated on the same isPlaceholder helper the
                disclosure NVD link and the case-3 anchor use. Renders only
                when `purchasable === true` AND `buyUrl` is no longer a
                placeholder string. While buyUrl === "TODO: confirm", nothing
                renders here; the "Launching" status above IS the affordance
                signal. The day a real storefront URL replaces the placeholder,
                this link appears automatically with zero code change. */}
            {forensia.purchasable && !isPlaceholder(forensia.buyUrl) ? (
              <a
                href={forensia.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5u inline-block font-mono text-caption uppercase text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
              >
                Get {forensia.name.split(" ")[0]}&nbsp;↗
              </a>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
