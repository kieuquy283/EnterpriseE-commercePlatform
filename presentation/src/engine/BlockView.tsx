import type { CSSProperties, ReactNode } from "react"
import { motion } from "motion/react"
import { useSlideMotion } from "./choreography.tsx"
import { MermaidChart } from "./MermaidChart.tsx"
import type {
  Badge as BadgeData,
  CardItem,
  SlideBlock,
  TableCell,
  TableRow,
} from "./types.ts"

function custom(properties: Record<string, string>): CSSProperties {
  return properties as CSSProperties
}

function Badge({ badge }: { badge: BadgeData }) {
  return (
    <span className={`badge badge--${badge.tone ?? "info"}`}>{badge.label}</span>
  )
}

function cell(value: string | TableCell): TableCell {
  return typeof value === "string" ? { text: value } : value
}

function Blocks({ blocks }: { blocks: SlideBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </>
  )
}

function Caption({ children }: { children?: string }) {
  if (!children) return null
  return <p className="block-caption">{children}</p>
}

function Card({ item, index }: { item: CardItem; index: number }) {
  const animation = useSlideMotion("item", index)
  return (
    <motion.article className="card" {...animation}>
      <div className="card__top">
        {item.eyebrow ? <span className="card__eyebrow">{item.eyebrow}</span> : null}
        {item.badge ? <Badge badge={item.badge} /> : null}
      </div>
      <h3 className="card__title">{item.title}</h3>
      {item.body ? <p className="card__body">{item.body}</p> : null}
      {item.meta ? <p className="card__meta">{item.meta}</p> : null}
    </motion.article>
  )
}

function Table({ block }: { block: Extract<SlideBlock, { type: "table" }> }) {
  return (
    <figure className="table-wrap">
      <table className={`data-table${block.compact ? " data-table--compact" : ""}`}>
        <thead>
          <tr>
            {block.head.map((heading) => (
              <th key={heading} scope="col">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row: TableRow, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((raw, cellIndex) => {
                const value = cell(raw)
                return (
                  <td key={cellIndex}>
                    <span>{value.text}</span>
                    {value.badge ? <Badge badge={value.badge} /> : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Caption>{block.caption}</Caption>
    </figure>
  )
}

function AnimatedItem({ index, children, className, as = "div" }: { index: number; children: ReactNode; className: string; as?: "div" | "li" }) {
  const animation = useSlideMotion("item", index)
  return as === "li" ? <motion.li className={className} {...animation}>{children}</motion.li>
    : <motion.div className={className} {...animation}>{children}</motion.div>
}

export function BlockView({ block }: { block: SlideBlock }) {
  switch (block.type) {
    case "diagram":
      return <figure className="block block--figure figure"><div className="figure__body"><MermaidChart definition={block.definition} label={block.label} /></div></figure>
    case "text":
      return (
        <div className="block block--text">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "points":
      return (
        <div className="block block--points">
          <ul className="points">
            {block.items.map((item, index) => (
              <li className="points__item" key={index}>
                {block.numbered ? (
                  <span className="points__number">{String(index + 1).padStart(2, "0")}</span>
                ) : item.term ? (
                  <span className="points__term">{item.term}</span>
                ) : null}
                <span className="points__text">{item.text}</span>
              </li>
            ))}
          </ul>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "cards": {
      const columns = block.columns ?? Math.min(block.items.length, 3)
      return (
        <div className="block block--cards">
          <div
            className={`cards${block.dense ? " cards--dense" : ""}`}
            style={custom({ "--card-cols": String(columns) })}
          >
            {block.items.map((item, index) => (
              <Card item={item} index={index} key={index} />
            ))}
          </div>
          <Caption>{block.caption}</Caption>
        </div>
      )
    }

    case "split": {
      const ratio = block.ratio ?? "1:1"
      const columns =
        ratio === "2:1" ? "2fr 1fr" : ratio === "1:2" ? "1fr 2fr" : "1fr 1fr"
      return (
        <div className="block block--split">
          <div className="split" style={custom({ "--split-cols": columns })}>
            <div className="split__column">
              <Blocks blocks={block.left} />
            </div>
            <div className="split__column">
              <Blocks blocks={block.right} />
            </div>
          </div>
          <Caption>{block.caption}</Caption>
        </div>
      )
    }

    case "grid":
      return (
        <div className="block block--grid">
          <div
            className="block-grid"
            style={custom({ "--grid-cols": String(block.columns ?? 2) })}
          >
            {block.blocks.map((nested, index) => (
              <div className="block-grid__cell" key={index}>
                <BlockView block={nested} />
              </div>
            ))}
          </div>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "table":
      return (
        <div className="block block--table">
          <Table block={block} />
        </div>
      )

    case "flow":
      return (
        <div className="block block--flow">
          <ol
            className={`flow${block.dense ? " flow--dense" : ""}`}
            style={custom({ "--flow-cols": String(block.steps.length) })}
          >
            {block.steps.map((step, index) => (
              <AnimatedItem as="li" className="flow__step" key={index} index={index}>
                <span className="flow__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flow__label">{step.label}</span>
                <h3 className="flow__title">{step.title}</h3>
                {step.detail ? <p className="flow__detail">{step.detail}</p> : null}
              </AnimatedItem>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "figure":
      return (
        <figure className="block block--figure figure">
          <div className="figure__body">{block.render()}</div>
          <Caption>{block.caption}</Caption>
        </figure>
      )

    case "code":
      return (
        <div className="block block--code">
          <div className="code-panel">
            {block.title ? <p className="code-panel__title">{block.title}</p> : null}
            <pre className="code">
              <code>{block.lines.join("\n")}</code>
            </pre>
          </div>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "stats":
      return (
        <div className="block block--stats">
          <dl
            className="stats"
            style={custom({ "--stat-cols": String(block.items.length) })}
          >
            {block.items.map((item, index) => (
              <AnimatedItem className="stat" key={item.label} index={index}>
                <dt className="stat__label">{item.label}</dt>
                <dd className="stat__value">
                  {item.value}
                  {item.unit ? <span className="stat__unit">{item.unit}</span> : null}
                </dd>
                {item.note ? <dd className="stat__note">{item.note}</dd> : null}
              </AnimatedItem>
            ))}
          </dl>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "note":
      return (
        <div className="block block--note">
          <aside className={`callout callout--${block.tone ?? "info"}`}>
            {block.title ? <strong className="callout__title">{block.title}</strong> : null}
            <span>{block.text}</span>
          </aside>
          <Caption>{block.caption}</Caption>
        </div>
      )

    case "roadmap":
      return (
        <div className="block block--roadmap">
          <ol
            className="roadmap"
            style={custom({ "--roadmap-cols": String(block.phases.length) })}
          >
            {block.phases.map((phase, index) => (
              <AnimatedItem as="li" className="roadmap__phase" key={phase.phase} index={index}>
                <div className="roadmap__top">
                  <span className="roadmap__phase-id">{phase.phase}</span>
                  {phase.status ? <Badge badge={phase.status} /> : null}
                </div>
                <h3 className="roadmap__title">{phase.title}</h3>
                <p className="roadmap__body">{phase.body}</p>
                <p className="roadmap__exit">{phase.exit}</p>
              </AnimatedItem>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </div>
      )

    default: {
      const exhaustive: never = block
      return exhaustive
    }
  }
}
