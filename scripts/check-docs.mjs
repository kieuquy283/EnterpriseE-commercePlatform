import { execFileSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { dirname, resolve, relative } from "node:path"

const root = process.cwd()
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0"))]
  .filter((file) => file.endsWith(".md") && existsSync(file))
const errors = []
let checked = 0
for (const file of files) {
  const source = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "")
  for (const match of source.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1].replace(/^<|>$/g, "")
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue
    let target
    try { target = decodeURIComponent(href.split(/[?#]/)[0]) } catch { errors.push(`${file}: invalid link encoding ${href}`); continue }
    if (!target) continue
    const destination = resolve(dirname(resolve(root, file)), target)
    checked++
    if (!existsSync(destination)) errors.push(`${file}: missing ${relative(root, destination)}`)
  }
}
const spec = resolve(root, "docs/spec")
for (const [name, prefix, count] of [["01-business.md", "FR", 9], ["02-flows.md", "FLOW", 9]]) {
  if (!existsSync(resolve(spec, name))) { errors.push(`Missing canonical spec: ${name}`); continue }
  const source = readFileSync(resolve(spec, name), "utf8")
  for (let i = 1; i <= count; i++) {
    const id = `${prefix}-${String(i).padStart(2, "0")}`
    if (!source.includes(id)) errors.push(`${name}: missing ${id}`)
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1 }
else console.log(`Documentation PASS: ${files.length} Markdown files, ${checked} local links, 9 core requirements and flows. Fragment anchors and diagram rendering require separate review.`)
