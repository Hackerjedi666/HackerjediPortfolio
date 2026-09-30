import { WALL_POSTS, POST_COUNT, SOCIALS, type WallPost } from "@/lib/content/site";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { CursorCard } from "@/components/chrome/cursor-card";
import { WRITING, DOCS_URL } from "@/lib/content/writing";
import { SectionHead } from "@/components/sections/section-head";

/** Column i takes every 3rd post, then repeats itself so the -50% drift
 *  loops seamlessly. Duplicates are `aria-hidden` — a screen reader hears
 *  each post exactly once. */
const column = (n: number) => WALL_POSTS.filter((_, i) => i % 3 === n);

const COLUMNS: { posts: WallPost[]; dir: string; dur: string; hover: string }[] = [
  { posts: column(0), dir: "drift-up", dur: "60s", hover: "hover:border-acid" },
  { posts: column(1), dir: "drift-down", dur: "69s", hover: "hover:border-ink" },
  { posts: column(2), dir: "drift-up", dur: "78s", hover: "hover:border-acid" },
];

function Card({
  post,
  hover,
  duplicate,
}: {
  post: WallPost;
  hover: string;
  duplicate?: boolean;
}) {
  const className = `block border border-hairline bg-panel p-4.5 text-ink-soft transition-[border-color,background-color,transform] duration-400 ease-out-expo hover:bg-panel-hi hover:scale-[1.02] ${hover}`;

  const inner = (
    <>
      <span className="mb-2.5 block text-micro text-acid">{post.date}</span>
      <span className="block text-sm leading-[1.45]">{post.title}</span>
    </>
  );

  // The duplicate pass exists only so the drift loops seamlessly. It is
  // aria-hidden and untabbable, and it must stay a plain anchor: giving it a
  // cursor card too would mean two previews racing for the same pointer.
  if (duplicate) {
    return (
      <a
        href={post.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-hidden
        tabIndex={-1}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <CursorCard
      href={post.url}
      kicker={post.date}
      description={post.title}
      className={className}
    >
      {inner}
    </CursorCard>
  );
}

export function Research() {
  return (
    <section
      id="research"
      aria-labelledby="research-title"
      className="section overflow-hidden border-t border-hairline pb-30"
    >
      <div className="shell shell-wide">
        <SectionHead
          index="06"
          label="RESEARCH"
          tone="ink"
          lede={`${POST_COUNT} posts on TEEs, quantum, malware internals and web3 security. Hover the wall to stop it.`}
        >
          <span id="research-title">I write. A lot.</span>
        </SectionHead>
      </div>

      {/* The wall. Masked top and bottom so cards dissolve rather than
          getting guillotined by the section edge. */}
      <div
        className="wall mt-10 grid h-[580px] grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-(--wall-gap) px-gutter [mask-image:linear-gradient(180deg,transparent,#000_14%,#000_86%,transparent)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_14%,#000_86%,transparent)]"
      >
        {COLUMNS.map((col, ci) => (
          <div key={ci} className="overflow-hidden">
            <div
              className="wall-col grid"
              style={
                {
                  "--wall-dir": col.dir,
                  "--wall-dur": col.dur,
                } as React.CSSProperties
              }
            >
              {col.posts.map((p) => (
                <Card key={p.url} post={p} hover={col.hover} />
              ))}
              {/* Second pass makes the drift seamless; hidden from the
                  accessibility tree so nothing is announced twice. */}
              {col.posts.map((p) => (
                <Card key={`dup-${p.url}`} post={p} hover={col.hover} duplicate />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* The long-form security writing on the practice's own site. Added
          alongside the wall, not instead of it: the wall is the X archive
          and these are the documentation pieces. */}
      <div className="shell shell-wide mt-14">
        <p className="text-label text-ink-label">Long-form, on overwatchlabs.ai</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WRITING.slice(0, 6).map((w) => (
            <CursorCard
              key={w.href}
              href={w.href}
              kicker={w.topic}
              description={w.blurb}
              className="rounded-cell border border-hairline bg-panel-hi p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <span className="block text-sm leading-snug">{w.title}</span>
            </CursorCard>
          ))}
        </div>
      </div>

      <div className="shell shell-wide mt-10 flex flex-wrap gap-3">
        <MagneticLink
          href={SOCIALS.twitter}
          external
          className="btn bg-ink text-void hover:bg-acid"
        >
          FOLLOW ON X →
        </MagneticLink>
        <MagneticLink href={SOCIALS.github} external className="btn btn-ghost">
          TOOLS ON GITHUB →
        </MagneticLink>
        <MagneticLink href={DOCS_URL} external className="btn btn-ghost">
          ALL DOCS →
        </MagneticLink>
      </div>
    </section>
  );
}
