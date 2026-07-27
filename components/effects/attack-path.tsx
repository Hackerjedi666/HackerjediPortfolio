/**
 * The graph revealed inside the Anatomy section's expanding panel.
 *
 * A BloodHound-style attack path: one low-privilege workstation, a forgotten
 * service account with weak delegation, three hops to a domain controller.
 * It's the section's own copy ("three hops, zero exploits") drawn instead of
 * described — which is the point of giving that headline a panel to open into.
 *
 * TWO LAYOUTS, NOT ONE SCALED DOWN. The landscape graph is 160×70; squeezed
 * into a phone-width panel its labels render at ~5.6px, which is not a
 * diagram, it's a smudge. Shrinking type further to avoid collisions makes it
 * worse. So the same five nodes and five edges are laid out twice — a wide
 * chain for desktop and a vertical zigzag for phones — and the panel switches
 * aspect ratio to match. Same data, same component, no duplicated content.
 *
 * TWO THINGS THIS FILE MUST DEFEND AGAINST, both because it lives inside an
 * <h2> and therefore inherits headline typography:
 *
 *   1. `letter-spacing`. The headline computes to -1.9px. Inherited into SVG
 *      that becomes -1.9 *user units*, and at a 2-unit font size the glyph
 *      advance goes negative — which renders every unset label backwards
 *      ("user01" drew as "10resu"). Every text node sets its own spacing and
 *      the root resets it.
 *   2. `text-transform: uppercase`, which would shout hostnames that read
 *      better lowercase. Reset on the root, applied per-label where wanted.
 */

type Tone = "dim" | "acid" | "hot";

type Node = { id: string; x: number; y: number; label: string; sub: string; tone: Tone };

const EDGES: { from: string; to: string; label: string; path: boolean }[] = [
  { from: "ws", to: "svc", label: "CanRDP", path: true },
  { from: "ws", to: "sql", label: "MemberOf", path: false },
  { from: "svc", to: "adm", label: "AllowedToDelegate", path: true },
  { from: "sql", to: "adm", label: "HasSession", path: false },
  { from: "adm", to: "dc", label: "DCSync", path: true },
];

const LABELS: Record<string, { label: string; sub: string; tone: Tone }> = {
  ws: { label: "WORKSTATION", sub: "user01", tone: "dim" },
  svc: { label: "SVC ACCOUNT", sub: "unconstrained deleg.", tone: "acid" },
  sql: { label: "MEMBER SRV", sub: "sql-02", tone: "dim" },
  adm: { label: "TIER-0 ADMIN", sub: "adm_backup", tone: "acid" },
  dc: { label: "DOMAIN CTRL", sub: "dc-01", tone: "hot" },
};

type Layout = {
  viewBox: string;
  width: number;
  height: number;
  grid: number;
  /** Node box half-width. */
  r: number;
  type: { label: number; sub: number; edge: number; title: number };
  title: string;
  titleAt: { x: number; y: number };
  pos: Record<string, { x: number; y: number }>;
  /**
   * Per-edge nudge for the relationship label, keyed "from-to".
   *
   * An edge label naturally sits at its midpoint, and in a tight vertical
   * layout that midpoint repeatedly lands on the node caption below the
   * upper node — "DCSYNC" printed straight through "DOMAIN CTRL". These are
   * hand-placed rather than computed: a perpendicular offset fixes some
   * collisions and creates others, and with five edges it is cheaper and
   * more predictable to just say where each one goes.
   */
  edgeOffset?: Record<string, { x: number; y: number }>;
};

const WIDE: Layout = {
  viewBox: "0 0 160 70",
  width: 160,
  height: 70,
  grid: 8,
  r: 3.2,
  type: { label: 2.4, sub: 2, edge: 1.9, title: 2.6 },
  title: "Shortest path to domain admin — 3 hops, 0 exploits",
  titleAt: { x: 5, y: 8 },
  pos: {
    ws: { x: 18, y: 50 },
    svc: { x: 56, y: 22 },
    sql: { x: 56, y: 54 },
    adm: { x: 104, y: 40 },
    dc: { x: 143, y: 22 },
  },
};

/** Portrait zigzag. Everything scales up because the viewBox is ~1.6× smaller. */
const TALL: Layout = {
  viewBox: "0 0 100 120",
  width: 100,
  height: 120,
  grid: 6,
  r: 3.4,
  type: { label: 4, sub: 3.4, edge: 3, title: 3.4 },
  title: "3 hops · 0 exploits",
  titleAt: { x: 5, y: 7 },
  pos: {
    ws: { x: 24, y: 100 },
    sql: { x: 74, y: 82 },
    svc: { x: 26, y: 66 },
    adm: { x: 68, y: 44 },
    dc: { x: 34, y: 18 },
  },
  edgeOffset: {
    "ws-svc": { x: 17, y: 3 },
    "ws-sql": { x: -6, y: 10 },
    "svc-adm": { x: -4, y: 10 },
    "sql-adm": { x: 9, y: 5 },
    "adm-dc": { x: 9, y: 5 },
  },
};

function Graph({ layout, idSuffix }: { layout: Layout; idSuffix: string }) {
  const nodes: Node[] = Object.entries(layout.pos).map(([id, p]) => ({
    id,
    x: p.x,
    y: p.y,
    ...LABELS[id],
  }));
  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const gridId = `ap-grid-${idSuffix}`;
  const { r, type } = layout;

  return (
    <svg
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Attack path graph: a low-privilege workstation reaches a domain controller in three hops via a service account with unconstrained delegation."
      className="h-full w-full"
      // Cut the inheritance chain from the headline. Without these two the
      // labels render backwards and in the wrong case.
      style={{ letterSpacing: "normal", textTransform: "none" }}
    >
      <defs>
        <pattern
          id={gridId}
          width={layout.grid}
          height={layout.grid}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${layout.grid} 0 L0 0 0 ${layout.grid}`}
            fill="none"
            stroke="var(--color-hairline)"
            strokeWidth="0.2"
          />
        </pattern>
      </defs>
      <rect width={layout.width} height={layout.height} fill={`url(#${gridId})`} />

      {EDGES.map((e) => {
        const a = byId(e.from);
        const b = byId(e.to);
        const nudge = layout.edgeOffset?.[`${e.from}-${e.to}`] ?? { x: 0, y: 0 };
        return (
          <g key={`${e.from}-${e.to}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={e.path ? "var(--color-acid)" : "var(--color-line-lift)"}
              strokeWidth={e.path ? 0.5 : 0.3}
              strokeDasharray={e.path ? "none" : "1.4 1.4"}
              opacity={e.path ? 0.9 : 0.55}
            />
            <text
              x={(a.x + b.x) / 2 + nudge.x}
              y={(a.y + b.y) / 2 - 1.6 + nudge.y}
              textAnchor="middle"
              fontSize={type.edge}
              letterSpacing="0.14"
              fill={e.path ? "var(--color-acid)" : "var(--color-ink-dim)"}
              opacity={e.path ? 0.9 : 0.5}
              style={{ textTransform: "uppercase" }}
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {nodes.map((n) => (
        <g key={n.id}>
          {n.tone === "hot" ? (
            <rect
              x={n.x - r - 1.6}
              y={n.y - r - 1.6}
              width={(r + 1.6) * 2}
              height={(r + 1.6) * 2}
              fill="var(--color-acid)"
              opacity="0.12"
            />
          ) : null}
          <rect
            x={n.x - r}
            y={n.y - r}
            width={r * 2}
            height={r * 2}
            fill="var(--color-void)"
            stroke={n.tone === "dim" ? "var(--color-line-lift)" : "var(--color-acid)"}
            strokeWidth="0.4"
          />
          {n.tone !== "dim" ? (
            <rect
              x={n.x - r * 0.34}
              y={n.y - r * 0.34}
              width={r * 0.68}
              height={r * 0.68}
              fill="var(--color-acid)"
            />
          ) : null}
          <text
            x={n.x}
            y={n.y + r + type.label * 1.4}
            textAnchor="middle"
            fontSize={type.label}
            letterSpacing="0.2"
            fill={n.tone === "dim" ? "var(--color-ink-label)" : "var(--color-ink)"}
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + r + type.label * 1.4 + type.sub * 1.3}
            textAnchor="middle"
            fontSize={type.sub}
            letterSpacing="0.06"
            fill="var(--color-ink-dim)"
          >
            {n.sub}
          </text>
        </g>
      ))}

      <text
        x={layout.titleAt.x}
        y={layout.titleAt.y}
        fontSize={type.title}
        letterSpacing="0.3"
        fill="var(--color-acid)"
        style={{ textTransform: "uppercase" }}
      >
        {layout.title}
      </text>
    </svg>
  );
}

export function AttackPath() {
  return (
    <>
      {/* aria-hidden on the duplicate: both carry the same aria-label, and a
          screen reader should hear this diagram described once. */}
      <div className="hidden h-full w-full md:block">
        <Graph layout={WIDE} idSuffix="wide" />
      </div>
      <div aria-hidden="true" className="h-full w-full md:hidden">
        <Graph layout={TALL} idSuffix="tall" />
      </div>
    </>
  );
}
