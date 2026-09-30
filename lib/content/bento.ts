import type { PatternName } from "@/components/bento/tile-pattern";

/**
 * The bento grid's tiles.
 *
 * REWRITTEN AGAINST THE CRAFT FLOOR. The previous version failed it in four
 * places, and those four things were exactly why the grid read as dull:
 *
 *   1. Every tile carried a section number (01 / 02 / 03). Numbers are only
 *      earned when the sequence itself is information the reader needs. Here
 *      they were decoration on eleven tiles.
 *   2. The identity tile had a kicker above its heading. A heading carries its
 *      own weight; the label is a hedge.
 *   3. Four cells of "big number, small label, accent" — the hero-metric
 *      template, verbatim. Four near-identical rectangles is what a grid looks
 *      like when nothing has been decided.
 *   4. Everything was text parked at the bottom of an empty box, so the page
 *      was 80% unlit surface.
 *
 * What replaces them: tiles that host the actual work. The fluid, the attack
 * graph and the terminal already exist in this codebase and are the most
 * interesting things on it — they belong on the first viewport, not behind a
 * click. `media` names which live component a tile renders behind its copy.
 */

export type TileId =
  | "identity"
  | "published"
  | "ops"
  | "forensia"
  | "stack"
  | "shell"
  | "signals"
  | "research"
  | "about";

export type Tile = {
  id: TileId;
  label: string;
  title: string;
  note?: string;
  /** A live component rendered behind the copy. The artifact, not an image. */
  media?: boolean;
  /** Texture behind the tile, drawn from the work the tile is about. */
  pattern?: PatternName;
  /** Columns at lg, out of 12. */
  span: number;
  rows?: number;
  /** The single bone tile. Exactly one, by design. */
  bone?: boolean;
  /** The single accent tile. Exactly one, by design. */
  accent?: boolean;
  opens?: boolean;
  href?: string;
};

/**
 * IDENTITY IS NOT IN HERE ANY MORE.
 *
 * It was an 8x2 cell with a border and a fill, which meant the page opened
 * on a rectangle. It is now <HeroLead>, a full-bleed band above the grid,
 * and the grid starts at the work. `TileId` still names it because the
 * hero re-uses the id as its anchor.
 *
 * The rows still total twelve:
 *   published 4 · shell 4 · forensia 4
 *   ops 8 (bone) · signals 4 (two rows)
 *   stack 4 · research 4
 *   about 12 — a full-width band, deliberately, so the grid does not end
 *   on yet another cell.
 */
export const TILES: Tile[] = [
  {
    id: "published",
    pattern: "radar",
    label: "Published",
    title: "CVE-2025-56459",
    note: "Stored XSS to remote code execution in a privileged Electron renderer, on OT and SCADA workstations.",
    accent: true,
    span: 4,
    opens: true,
  },
  {
    id: "shell",
    pattern: "scan",
    label: "Interactive",
    title: "Type at me.",
    note: "Three questions in a terminal, and it lands in my inbox. No form to fill in.",
    media: true, // a live prompt line
    span: 4,
    opens: true,
  },
  {
    id: "forensia",
    pattern: "matrix",
    label: "What I build",
    title: "Shipped,\nnot slideware.",
    note: "An offensive practice, a threat-intel platform, and an on-chain investigations workspace.",
    span: 4,
    opens: true,
  },
  {
    id: "ops",
    pattern: "hatch",
    label: "Selected engagements",
    title: "Proof, not\na scan report.",
    note: "Banks, insurers and state platforms. Clients stay anonymous, the tradecraft doesn't.",
    bone: true,
    span: 8,
    opens: true,
  },
  {
    id: "signals",
    label: "On X",
    title: "Thinking\nout loud.",
    pattern: "matrix",
    span: 4,
    rows: 2,
    opens: false,
  },
  {
    id: "stack",
    pattern: "ports",
    label: "Capability",
    title: "Four disciplines.\nOne toolkit.",
    /* NO NOTE, deliberately. It listed the four disciplines in prose, and
       the tile now marquees all twenty-two tools above the heading — the
       same claim, shown instead of asserted. Keeping both did not fit:
       three lines of note left the marquee overlapping "Four disciplines"
       by about ten pixels, and the honest fix for "these two things do not
       fit" is to drop the weaker one, not to shrink both until they do. */
    span: 4,
    opens: true,
  },
  {
    id: "research",
    media: true,
    pattern: "topo",
    label: "Writing",
    title: "Notes from\nthe field.",
    span: 4,
    opens: true,
  },
  {
    id: "about",
    pattern: "trace",
    label: "About",
    title: "Mostly inside\nother people's\nnetworks.",
    note: "Financial services, healthcare, insurance and government. OSCP certified, and every finding ships with reproducible proof.",
    /* Full width. The grid used to end on an 8 + a gap, which read as a
       row someone forgot to finish; running it edge to edge makes it a
       closing band instead of a last cell. */
    span: 12,
    opens: true,
  },
];
