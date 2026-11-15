import { useContext, useEffect, useId, useRef, useState } from "react"
import { animate, stagger } from "motion/react"
import { SlideMotionContext } from "./choreography.tsx"

let setup: Promise<typeof import("mermaid")["default"]> | undefined
function renderer() {
  setup ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false, securityLevel: "strict", theme: "base",
      fontFamily: "Inter Variable, sans-serif",
      themeVariables: { fontSize: "20px", primaryColor: "#f5f7e8", primaryTextColor: "#252720", primaryBorderColor: "#858d62", lineColor: "#73795a", secondaryColor: "#dce2b7", tertiaryColor: "#fafbf6" },
      flowchart: { htmlLabels: false, curve: "basis", nodeSpacing: 22, rankSpacing: 32, wrappingWidth: 240, padding: 12, useMaxWidth: true },
    })
    return mermaid
  })
  return setup
}

export function MermaidChart({ definition, label }: { definition: string; label: string }) {
  const id = `diagram-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const [svg, setSvg] = useState("")
  const [failed, setFailed] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const { enabled } = useContext(SlideMotionContext)
  useEffect(() => {
    let current = true
    setFailed(false)
    void renderer().then(async mermaid => {
      const result = await mermaid.render(id, definition)
      if (current) setSvg(result.svg)
    }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [definition, id])
  useEffect(() => {
    if (!svg || !enabled || !root.current) return
    const nodes = root.current.querySelectorAll("g.node")
    const edges = root.current.querySelectorAll(".flowchart-link")
    const controls = [
      animate(nodes, { opacity: [0, 1] }, { duration: .4, delay: stagger(.08, { startDelay: .25 }) }),
      animate(edges, { opacity: [0, 1] }, { duration: .5, delay: .6 }),
    ]
    return () => controls.forEach(control => control.stop())
  }, [svg, enabled])
  if (failed) return <p>Không thể hiển thị sơ đồ.</p>
  return <div className="mermaid-chart" role="img" aria-label={label} ref={root} dangerouslySetInnerHTML={{ __html: svg }} />
}
