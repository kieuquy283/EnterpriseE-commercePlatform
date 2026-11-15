import { execFileSync } from "node:child_process"
import { readFileSync, existsSync, statSync } from "node:fs"

// Git's inventory excludes ignored environment files, dependencies and output.
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0"))]
const allowed = /\.(?:[cm]?[jt]sx?|py|sh|ya?ml|css|jsonc?)$/
let count = 0
for (const file of files) {
  if (!allowed.test(file) || !existsSync(file) || !statSync(file).isFile() || /(?:^|\/)(?:dist|node_modules|\.medusa|\.next)\//.test(file)) continue
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    if (/TODO\((?:impl|refactor|dup|shared|design|test|perf|security|ops)\):/.test(line)) {
      console.log(`${file}:${index + 1}: ${line.trim()}`)
      count++
    }
  })
}
console.log(`${count} typed TODO annotations. See docs/spec/07-delivery.md for larger work.`)
