import { enrichTweet } from "react-tweet";
import { getTweet } from "react-tweet/api";
import { cn } from "@/lib/utils";

/**
 * A tweet, rendered in this site's own language.
 *
 * Based on MagicUI's `tweet-card` — the `react-tweet` dependency and the
 * `getTweet` / `enrichTweet` pair are genuinely the right tools, so those
 * are kept. What is not kept is its 9KB of markup: that component ships its
 * own light/dark palette, its own border and radius scale, and its own type
 * sizes, none of which are this project's. Dropping a card styled like
 * twitter.com onto a committed dark-luxury page is exactly the "assembled
 * rather than designed" tell. The data layer is theirs; the surface is ours.
 *
 * FETCHED AT BUILD. The page is statically prerendered, so this costs the
 * visitor nothing and there is no client-side syndication request. The
 * trade-off is that a failure must never break the build, hence the
 * try/catch: if the tweet cannot be read, the tile simply renders without
 * it rather than the whole page failing to compile.
 */
export async function TweetCard({
  id,
  className,
  size = "sm",
}: {
  id: string;
  className?: string;
  /**
   * "sm" is the column card — seven of them stacked in a tile, so it is
   * sized to be scanned. "lg" is the single featured card on the identity
   * tile, where it is the only thing competing with the headline and has to
   * hold its own against a 58rem-wide surface; at the column's size it read
   * as a stray notification.
   */
  size?: "sm" | "lg";
}) {
  let tweet;
  try {
    const raw = await getTweet(id);
    tweet = raw ? enrichTweet(raw) : null;
  } catch {
    tweet = null;
  }
  if (!tweet) return null;

  // The syndication API returns HTML-escaped text, and `enrichTweet` passes
  // it through untouched — so an arrow typed as "->" arrives as "-&gt;" and
  // renders literally. React escapes on output anyway, so decoding here is
  // safe and is the only way to get the author's actual characters back.
  const decode = (t: string) =>
    t
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, "\u00A0");

  const lg = size === "lg";

  const date = new Date(tweet.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group block rounded-cell border border-hairline bg-cell-hi no-underline transition-colors duration-400 ease-out-expo hover:border-line-lift",
        lg ? "p-6" : "p-4",
        className
      )}
    >
      <div className={cn("flex items-center", lg ? "gap-4" : "gap-3")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tweet.user.profile_image_url_https}
          alt=""
          width={lg ? 44 : 30}
          height={lg ? 44 : 30}
          className={cn(
            "flex-none rounded-pill",
            lg ? "h-[44px] w-[44px]" : "h-[30px] w-[30px]"
          )}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-semibold text-ink",
              lg ? "text-chip" : "text-label"
            )}
          >
            {tweet.user.name}
          </p>
          <p
            className={cn("truncate text-ink-dim", lg ? "text-chip" : "text-label")}
          >
            @{tweet.user.screen_name}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "ml-auto flex-none text-ink-dim",
            lg ? "text-chip" : "text-label"
          )}
        >
          {date}
        </span>
      </div>

      {/* `entities` carries the tweet split into text and link runs, which is
          why enrichTweet is worth the dependency — rendering `text` raw would
          leave bare t.co URLs in the middle of sentences.

          CLAMPED. Without a line limit the card's height is whatever length
          the author happened to write, which is not a layout — a long tweet
          grew it to 472px inside a 503px tile and pushed past the edge. Four
          lines is the preview; the link is how you read the rest. */}
      <p
        className={cn(
          "whitespace-pre-wrap leading-relaxed text-ink-soft",
          lg ? "mt-5 line-clamp-6 text-body" : "mt-3 line-clamp-4 text-chip"
        )}
      >
        {tweet.entities.map((item, i) =>
          item.type === "text" ? (
            <span key={i}>{decode(item.text)}</span>
          ) : (
            <span key={i} className="text-acid">
              {decode(item.text)}
            </span>
          )
        )}
      </p>

      <p
        className={cn(
          "flex items-center gap-4 text-ink-dim",
          lg ? "mt-5 text-chip" : "mt-3 text-label"
        )}
      >
        <span>{tweet.favorite_count} likes</span>
        <span
          aria-hidden="true"
          className="transition-transform duration-400 ease-out-expo group-hover:translate-x-0.5"
        >
          Read on X →
        </span>
      </p>
    </a>
  );
}
