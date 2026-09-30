/**
 * X uses the same card.
 *
 * `twitter-image` is a separate file convention from `opengraph-image`,
 * and without it X falls back to whatever it can scrape rather than to
 * the Open Graph image reliably. Re-exporting is the whole file: one
 * design, two conventions, no second copy to keep in step.
 */
export { default, alt, size, contentType } from "./opengraph-image";
