import { WALL_POSTS, POST_COUNT, SOCIALS, type WallPost } from "@/lib/content/site";
import { MagneticLink } from "@/components/chrome/magnetic-link";
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
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer noopener"
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      className={`block border border-hairline bg-panel p-4.5 text-ink-soft transition-[border-color,background-color,transform] duration-200 hover:bg-panel-hi hover:scale-[1.02] ${hover}`}
    >
      <span className="mb-2.5 block text-micro tracking-[0.18em] text-acid">
        {post.date}
      </span>
      <span className="block text-sm leading-[1.45]">{post.title}</span>
    </a>
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
      </div>
    </section>
  );
}
