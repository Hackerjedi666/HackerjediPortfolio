/**
 * The graph revealed inside the Anatomy section's expanding panel.
 *
 * A BloodHound-style attack path: one low-privilege workstation, a forgotten
 * service account with weak delegation, three hops to a domain controller.
 * It's the section's own copy ("three hops, zero exploits") drawn instead of
 * described — which is the point of giving that headline a panel to open into.
 *
 * TWO THINGS THIS FILE HAS TO DEFEND AGAINST, both because it lives inside
 * an <h2> and therefore inherits headline typography:
 *
 *   1. `letter-spacing`. The headline computes to -1.9px. Inherited into SVG
 *      that becomes -1.9 *user units*, and at a 2-unit font size the glyph
 *      advance goes negative — which renders every unset label backwards
 *      ("user01" drew as "10resu"). Every text node sets its own spacing and
 *      the root resets it.
 *   2. `text-transform: uppercase`, which would shout hostnames that read
 *      better lowercase. Reset on the root, applied per-label where wanted.
 *
 * The viewBox is 16:7 to match the panel exactly. A square viewBox with
 * `meet` letterboxes into a wide panel, which left the graph stranded in the
 * middle with dead space either side.
 */

type Tone = "dim" | "acid" | "hot";

const NODES: {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  tone: Tone;
}[] = [
  { id: "ws", x: 18, y: 50, label: "WORKSTATION", sub: "user01", tone: "dim" },
  { id: "svc", x: 56, y: 22, label: "SVC ACCOUNT", sub: "unconstrained deleg.", tone: "acid" },
  { id: "sql", x: 56, y: 54, label: "MEMBER SRV", sub: "sql-02", tone: "dim" },
  { id: "adm", x: 104, y: 40, label: "TIER-0 ADMIN", sub: "adm_backup", tone: "acid" },
  { id: "dc", x: 143, y: 22, label: "DOMAIN CTRL", sub: "dc-01", tone: "hot" },
];

const EDGES: { from: string; to: string; label: string; path: boolean }[] = [
  { from: "ws", to: "svc", label: "CanRDP", path: true },
  { from: "ws", to: "sql", label: "MemberOf", path: false },
  { from: "svc", to: "adm", label: "AllowedToDelegate", path: true },
  { from: "sql", to: "adm", label: "HasSession", path: false },
  { from: "adm", to: "dc", label: "DCSync", path: true },
];

const byId = (id: string) => NODES.find((n) => n.id === id)!;

/** Half-width of a node box, in user units. */
const R = 3.2;

export function AttackPath() {
  return (
    <svg
      viewBox="0 0 160 70"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Attack path graph: a low-privilege workstation reaches a domain controller in three hops via a service account with unconstrained delegation."
      className="h-full w-full"
      // Cut the inheritance chain from the headline. Without these two the
      // labels render backwards and in the wrong case.
      style={{ letterSpacing: "normal", textTransform: "none" }}
    >
      <defs>
        <pattern id="ap-grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0 L0 0 0 8" fill="none" stroke="var(--color-hairline)" strokeWidth="0.2" />
        </pattern>
      </defs>
      <rect width="160" height="70" fill="url(#ap-grid)" />

      {EDGES.map((e) => {
        const a = byId(e.from);
        const b = byId(e.to);
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
              x={(a.x + b.x) / 2}
              y={(a.y + b.y) / 2 - 1.6}
              textAnchor="middle"
              fontSize="1.9"
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

      {NODES.map((n) => (
        <g key={n.id}>
          {n.tone === "hot" ? (
            <rect
              x={n.x - R - 1.6}
              y={n.y - R - 1.6}
              width={(R + 1.6) * 2}
              height={(R + 1.6) * 2}
              fill="var(--color-acid)"
              opacity="0.12"
            />
          ) : null}
          <rect
            x={n.x - R}
            y={n.y - R}
            width={R * 2}
            height={R * 2}
            fill="var(--color-void)"
            stroke={n.tone === "dim" ? "var(--color-line-lift)" : "var(--color-acid)"}
            strokeWidth="0.4"
          />
          {n.tone !== "dim" ? (
            <rect x={n.x - 1.1} y={n.y - 1.1} width="2.2" height="2.2" fill="var(--color-acid)" />
          ) : null}
          <text
            x={n.x}
            y={n.y + R + 3.4}
            textAnchor="middle"
            fontSize="2.4"
            letterSpacing="0.2"
            fill={n.tone === "dim" ? "var(--color-ink-label)" : "var(--color-ink)"}
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + R + 6.6}
            textAnchor="middle"
            fontSize="2"
            letterSpacing="0.06"
            fill="var(--color-ink-dim)"
          >
            {n.sub}
          </text>
        </g>
      ))}

      <text
        x="5"
        y="8"
        fontSize="2.6"
        letterSpacing="0.3"
        fill="var(--color-acid)"
        style={{ textTransform: "uppercase" }}
      >
        Shortest path to domain admin — 3 hops, 0 exploits
      </text>
    </svg>
  );
}
