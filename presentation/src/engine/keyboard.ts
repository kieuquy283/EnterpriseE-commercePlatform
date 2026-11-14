export type DeckAction = "next" | "prev" | "first" | "last" | "play"

export function resolveKeyAction(
  event: { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean },
  context: { editable: boolean; buttonFocused: boolean },
): DeckAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey || context.editable) return null
  if ((event.key === " " || event.key === "Spacebar") && context.buttonFocused) return null
  if (event.key === "Enter" && context.buttonFocused) return null

  switch (event.key) {
    case "ArrowRight":
    case "Enter":
      return "next"
    case "ArrowLeft":
      return "prev"
    case "Home":
      return "first"
    case "End":
      return "last"
    case " ":
    case "Spacebar":
      return "play"
    default:
      return null
  }
}
