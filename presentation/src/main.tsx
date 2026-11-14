import "@fontsource-variable/inter"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/base.css"
import "./styles/slide.css"
import "./styles/presentation.css"
import "./styles/reference-style.css"
import { Deck } from "./engine/Deck.tsx"
import { registry } from "./reports/registry.ts"

const container = document.getElementById("root")
if (!container) {
  throw new Error("Root element #root was not found.")
}

createRoot(container).render(
  <StrictMode>
    <Deck registry={registry} />
  </StrictMode>,
)
