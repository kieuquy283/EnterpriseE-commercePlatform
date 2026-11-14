type Point = readonly [number, number]

function arrowAngle(from: Point, to: Point): number {
  return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI
}

function Arrow({
  from,
  to,
  label,
  dashed = false,
  accent = false,
  labelOffset = -7,
}: {
  from: Point
  to: Point
  label?: string
  dashed?: boolean
  accent?: boolean
  labelOffset?: number
}) {
  const [x1, y1] = from
  const [x2, y2] = to
  const angle = arrowAngle(from, to)
  return (
    <g
      className={`dg-edge${dashed ? " dg-edge--dashed" : ""}${
        accent ? " dg-edge--accent" : ""
      }`}
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path
        className="dg-arrowhead"
        d={`M ${x2} ${y2} l -8 -4 l 0 8 z`}
        transform={`rotate(${angle} ${x2} ${y2})`}
      />
      {label ? (
        <text
          className="dg-edge-label"
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 + labelOffset}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function Elbow({
  points,
  label,
}: {
  points: Point[]
  label?: string
}) {
  const first = points[0]
  const last = points[points.length - 1]
  const previous = points[points.length - 2]
  if (!first || !last || !previous) return null
  const angle = arrowAngle(previous, last)
  const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  return (
    <g className="dg-edge dg-edge--dashed">
      <path d={d} fill="none" />
      <path
        className="dg-arrowhead"
        d={`M ${last[0]} ${last[1]} l -8 -4 l 0 8 z`}
        transform={`rotate(${angle} ${last[0]} ${last[1]})`}
      />
      {label ? (
        <text
          className="dg-edge-label"
          x={(first[0] + last[0]) / 2 + 10}
          y={(first[1] + last[1]) / 2}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function Connector({
  from,
  to,
  label,
}: {
  from: Point
  to: Point
  label?: string
}) {
  return (
    <g className="dg-edge dg-edge--soft">
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
      <circle cx={from[0]} cy={from[1]} r={2.4} className="dg-dot" />
      <circle cx={to[0]} cy={to[1]} r={2.4} className="dg-dot" />
      {label ? (
        <text
          className="dg-edge-label"
          x={(from[0] + to[0]) / 2}
          y={(from[1] + to[1]) / 2 - 6}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function Node({
  x,
  y,
  width,
  height,
  title,
  lines = [],
  accent = false,
  dashed = false,
  soft = false,
  titleSize = 13.5,
}: {
  x: number
  y: number
  width: number
  height: number
  title: string
  lines?: string[]
  accent?: boolean
  dashed?: boolean
  soft?: boolean
  titleSize?: number
}) {
  return (
    <g>
      <rect
        className={`dg-box${accent ? " dg-box--accent" : ""}${
          dashed ? " dg-box--dashed" : ""
        }${soft ? " dg-box--soft" : ""}`}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
      />
      <text
        className="dg-title"
        x={x + 14}
        y={y + 24}
        style={{ fontSize: `${titleSize}px` }}
      >
        {title}
      </text>
      {lines.map((line, index) => (
        <text
          className="dg-line"
          x={x + 14}
          y={y + 42 + index * 14}
          key={line}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function Chip({
  x,
  y,
  width,
  height,
  label,
  accent = false,
}: {
  x: number
  y: number
  width: number
  height: number
  label: string
  accent?: boolean
}) {
  return (
    <g>
      <rect
        className={`dg-chip${accent ? " dg-chip--accent" : ""}`}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
      />
      <text
        className="dg-chip-label"
        x={x + width / 2}
        y={y + height / 2 + 3.4}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}

export function SystemDiagram() {
  return (
    <svg
      viewBox="0 0 1080 480"
      role="img"
      aria-label="Browser to Next.js storefront, Medusa API and worker, with PostgreSQL as system of record, Redis and S3 as supporting stores, plus manual carrier and email adapter."
    >
      <Node
        x={12}
        y={170}
        width={128}
        height={96}
        title="Browser"
        lines={["Customer", "Admin /app"]}
      />
      <Node
        x={168}
        y={150}
        width={180}
        height={136}
        title="Next.js storefront"
        lines={[
          "ECS Fargate · 1 task",
          "1 vCPU",
          "pages · cart · checkout",
          "calls Store API via SDK",
        ]}
      />
      <Node
        x={380}
        y={28}
        width={348}
        height={270}
        title="Medusa API · Fargate"
        lines={["1–2 vCPU · ~60% CPU at demo load"]}
      />

      <Chip x={394} y={80} width={152} height={40} label="Catalog + pricing" />
      <Chip x={556} y={80} width={152} height={40} label="Cart + checkout" />
      <Chip x={394} y={128} width={152} height={40} label="Payment · COD" />
      <Chip x={556} y={128} width={152} height={40} label="Inventory" />
      <Chip x={394} y={176} width={152} height={40} label="Order" />
      <Chip x={556} y={176} width={152} height={40} label="Fulfilment" />
      <Chip
        x={394}
        y={224}
        width={152}
        height={40}
        label="Idempotency *"
        accent
      />
      <Chip
        x={556}
        y={224}
        width={152}
        height={40}
        label="COD reconciliation *"
        accent
      />
      <text className="dg-note" x={394} y={286}>
        Modules are code boundaries inside one application, not services.
      </text>

      <Node
        x={380}
        y={330}
        width={348}
        height={112}
        title="Medusa worker · Fargate"
        lines={["1 task · same image"]}
      />
      <Chip x={394} y={366} width={100} height={54} label="Outbox relay" />
      <Chip x={504} y={366} width={100} height={54} label="Notifications" />
      <Chip x={614} y={366} width={100} height={54} label="Reconciliation" />
      <text className="dg-note" x={394} y={434}>
        At-least-once consumers · retry, dedupe, DLQ.
      </text>

      <Node
        x={772}
        y={28}
        width={196}
        height={96}
        title="PostgreSQL"
        lines={["RDS Single-AZ · private", "the only system of record"]}
      />
      <Node
        x={772}
        y={142}
        width={196}
        height={76}
        title="Redis"
        lines={["EC2 · single instance", "events · locks · cache"]}
      />
      <Node
        x={772}
        y={236}
        width={196}
        height={72}
        title="S3 · private"
        lines={["media via backend proxy", "no CDN in front"]}
      />
      <Node
        x={772}
        y={326}
        width={196}
        height={56}
        title="Email sandbox"
        lines={["notification adapter"]}
      />
      <Node
        x={12}
        y={330}
        width={300}
        height={80}
        title="Carrier handover · manual"
        lines={["ops enters tracking events", "no carrier API in this MVP"]}
        dashed
      />

      <Arrow from={[140, 218]} to={[168, 218]} />
      <Arrow from={[348, 218]} to={[380, 218]} />
      <Arrow from={[728, 72]} to={[772, 72]} label="SQL" labelOffset={-8} />
      <Arrow
        from={[728, 180]}
        to={[772, 180]}
        label="events"
        labelOffset={-8}
      />
      <Arrow from={[728, 252]} to={[772, 268]} label="media" labelOffset={-6} />
      <Arrow from={[728, 354]} to={[772, 354]} label="email" labelOffset={-7} />
      <Elbow points={[[728, 410], [748, 410], [748, 202], [772, 202]]} />
      <Arrow
        from={[312, 366]}
        to={[380, 292]}
        dashed
        label="manual entry"
        labelOffset={14}
        accent
      />

      <text className="dg-legend" x={12} y={456}>
        One codebase · two Medusa processes · three deployable units
      </text>
      <text className="dg-legend" x={1068} y={456} textAnchor="end">
        Solid = synchronous · dashed = asynchronous or manual
      </text>
    </svg>
  )
}

export function OwnershipDiagram() {
  return (
    <svg
      viewBox="0 0 1080 430"
      role="img"
      aria-label="Medusa core and custom modules own commerce tables in PostgreSQL. Next.js holds only UI state, Redis is ephemeral, and S3 holds media only. The storefront never writes commerce tables directly."
    >
      <Node
        x={330}
        y={20}
        width={420}
        height={120}
        title="Medusa core modules"
        lines={["own commerce tables; transactions stay inside"]}
      />
      <Chip x={344} y={74} width={92} height={26} label="Product" />
      <Chip x={442} y={74} width={92} height={26} label="Pricing" />
      <Chip x={540} y={74} width={92} height={26} label="Cart" />
      <Chip x={638} y={74} width={92} height={26} label="Order" />
      <Chip x={344} y={106} width={92} height={26} label="Payment" />
      <Chip x={442} y={106} width={92} height={26} label="Inventory" />
      <Chip x={540} y={106} width={92} height={26} label="Fulfilment" />
      <Chip x={638} y={106} width={92} height={26} label="Customer" />

      <Node
        x={380}
        y={175}
        width={320}
        height={80}
        title="PostgreSQL"
        lines={["system of record", "unique constraints enforce invariants"]}
        accent
      />

      <Node
        x={330}
        y={300}
        width={420}
        height={104}
        title="Custom modules · extend, never fork"
        lines={["own keys, remittances and delivery evidence"]}
      />
      <Chip
        x={344}
        y={338}
        width={120}
        height={28}
        label="Idempotency"
        accent
      />
      <Chip
        x={472}
        y={338}
        width={142}
        height={28}
        label="COD reconciliation"
        accent
      />
      <Chip
        x={622}
        y={338}
        width={114}
        height={28}
        label="Notification log"
        accent
      />
      <text className="dg-note" x={344} y={388}>
        No raw SQL from the storefront · no editing of Medusa tables.
      </text>

      <Connector from={[540, 140]} to={[540, 175]} label="owns" />
      <Connector from={[540, 255]} to={[540, 300]} label="owned records" />

      <Node
        x={20}
        y={160}
        width={220}
        height={110}
        title="Next.js storefront"
        lines={["session cookie · cart id", "presentation state only", "no commerce writes"]}
      />
      <Arrow from={[240, 190]} to={[330, 110]} label="Store API" labelOffset={-8} />

      <Node
        x={840}
        y={34}
        width={220}
        height={76}
        title="Redis"
        lines={["ephemeral coordination", "never a record of truth"]}
        soft
      />
      <Node
        x={840}
        y={126}
        width={220}
        height={76}
        title="S3 · private"
        lines={["product media only", "backend proxy, no CDN"]}
        soft
      />
      <Node
        x={840}
        y={218}
        width={220}
        height={76}
        title="Medusa Admin"
        lines={["ops, stock, fulfilment", "authorized server-side"]}
        soft
      />
      <Arrow
        from={[750, 60]}
        to={[840, 72]}
        dashed
        label="cache / events"
        labelOffset={-8}
      />
      <Arrow
        from={[750, 120]}
        to={[840, 158]}
        dashed
        label="media"
        labelOffset={-8}
      />

      <g className="dg-edge dg-edge--dashed dg-edge--accent">
        <line x1={130} y1={270} x2={380} y2={228} />
        <line x1={248} y1={242} x2={262} y2={258} />
        <line x1={262} y1={242} x2={248} y2={258} />
        <text className="dg-edge-label" x={222} y={300}>
          no direct writes
        </text>
      </g>

      <text className="dg-legend" x={20} y={414}>
        Ownership is the architecture: a module that writes another module's
        tables is a defect.
      </text>
    </svg>
  )
}
