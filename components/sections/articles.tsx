import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { isPlaceholder } from "@/lib/utils";

// Editorial date format — "18 NOV 2025". Distinct from Selected Work's
// year-only date and from any prose date — looks like a newspaper dateline.
// UTC kept explicit so SSR and client see the same string regardless of
// where the page is built/served.
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();
}

export function Articles() {
  // Newest-first sort at render. Invalid dates sort to 0 (end of list)
  // rather than NaN-corrupting the comparator. Server component again —
  // the show-more state is gone, no client interactivity left here.
  const articles = [...PORTFOLIO_DATA.articles].sort((a, b) => {
    const ta = new Date(b.date).getTime() || 0;
    const tb = new Date(a.date).getTime() || 0;
    return ta - tb;
  });
  const total = articles.length;
  if (total === 0) return null;

  const eyebrow = `Field Notes / 001${total > 1 ? `–${String(total).padStart(3, "0")}` : ""}`;
  const profileUrl = PORTFOLIO_DATA.meta.socials.twitter;
  const profileHandle = profileUrl.replace(/^https?:\/\/x\.com\//, "@");

  return (
    <section
      id="articles"
      aria-labelledby="articles-heading"
      className="px-3u py-18u md:px-8u"
    >
      {/* Section header — same grammar as the rest. Eyebrow uses "Field Notes"
          (a writer's ongoing observation log) rather than the data noun
          "Articles", to flavor the genre. h2 stays "Articles" — neutral and
          parallel to "Ventures" / "Open Source" (data-noun titles). Lede
          names the drive-to-X intent honestly: written there, read there. */}
      <div className="grid grid-cols-12 gap-x-3u">
        <header className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-mono text-caption uppercase text-ink-mute">{eyebrow}</p>
          <h2
            id="articles-heading"
            className="mt-3u font-serif text-h2 text-balance text-ink"
          >
            Articles
          </h2>
          <p className="mt-5u max-w-[52ch] font-serif text-lede text-ink-soft">
            Research notes on offensive security and trusted-execution work.
            Published on X — read in full there.
          </p>
        </header>
      </div>

      {/* Inner-scroll container — all 38 rows live inside a fixed-height
          region on desktop (max-h: 60vh ≈ 5-6 rows visible), with the rest
          reachable via an overscroll-contained inner scroll. The container
          styling lives in globals.css (.articles-scroll, gated to md+),
          including the thin theme-tokened scrollbar and bottom mask fade.
          On mobile, the .articles-scroll rules unset → list flows naturally
          (nested touch scroll is consistently janky on iOS/Android).

          The outer grid handles column alignment; the inner div is the
          .articles-scroll container; the <ol> is a simple stacked list
          (no inner grid — that would leave dead empty columns inside the
          scroll region). */}
      <div className="mt-8u grid grid-cols-12 gap-x-3u md:mt-12u">
        <div
          tabIndex={0}
          data-lenis-prevent
          aria-label={`Article list — ${total} entries, scrollable`}
          className="articles-scroll col-span-12 md:col-span-9 md:col-start-3"
        >
          <ol id="articles-list" className="m-0 list-none p-0">
            {articles.map((article, index) => {
              const showBlurb = !isPlaceholder(article.blurb);
              return (
                <li key={article.id} className="m-0 p-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read on X: ${article.title}`}
                    className={
                      "group block py-3u" +
                      (index > 0 ? " border-t border-rule" : "")
                    }
                  >
                    {/* Dateline — mono caption directly above the title. */}
                    <p className="font-mono text-caption uppercase text-ink-mute">
                      <time dateTime={article.date}>{formatDate(article.date)}</time>
                    </p>
                    {/* Title — serif text-lede with inline trailing ↗. */}
                    <h3 className="mt-1u font-serif text-lede text-balance text-ink">
                      <span className="underline decoration-rule underline-offset-4 group-hover:decoration-accent">
                        {article.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className="ml-2u font-mono text-caption text-ink-mute group-hover:text-accent"
                      >
                        ↗
                      </span>
                    </h3>
                    {/* Blurb — gated. "TODO: confirm" stays invisible. */}
                    {showBlurb ? (
                      <p className="mt-2u max-w-[60ch] font-serif text-body text-ink-soft">
                        {article.blurb}
                      </p>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Section foot — single drive-to-profile link. OUTSIDE the scroll
          container so it's always visible (the whole point of an inner
          scroll is the section stays compact; burying the foot link inside
          the scroll would defeat that). */}
      <div className="mt-8u grid grid-cols-12 gap-x-3u">
        <div className="col-span-12 md:col-span-9 md:col-start-3">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-caption uppercase text-ink-mute underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-accent"
          >
            More on X&nbsp;&nbsp;·&nbsp;&nbsp;{profileHandle}&nbsp;↗
          </a>
        </div>
      </div>
    </section>
  );
}
