// Capture command output without weakening its exit status. Never pass secrets in argv.
import { spawn } from "node:child_process"
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { execFileSync } from "node:child_process"

const [name, command, ...args] = process.argv.slice(2)
if (!/^[a-z0-9-]+$/.test(name || "") || !command) {
  throw new Error("Usage: node scripts/ci-run.mjs <gate-name> <command> [arguments]")
}
const directory = resolve("ci-evidence")
mkdirSync(directory, { recursive: true })
const log = resolve(directory, `${name}.log`)
writeFileSync(log, "")
const sanitize = (line) =>
  line
    .replace(/(postgres(?:ql)?:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi, "$1[REDACTED]@")
    .replace(/\b(Bearer\s+)[^\s"',]+/gi, "$1[REDACTED]")
    .replace(
      /\b((?:access_token|refresh_token|password|jwt_secret|cookie_secret)["']?\s*[:=]\s*)[^\s,}]+/gi,
      "$1[REDACTED]",
    )
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED JWT]")
const started = new Date().toISOString()
const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] })
for (const stream of [child.stdout, child.stderr]) {
  let pending = ""
  stream.setEncoding("utf8")
  stream.on("data", (chunk) => {
    pending += chunk
    const lines = pending.split("\n")
    pending = lines.pop()
    for (const line of lines) {
      const safe = `${sanitize(line)}\n`
      appendFileSync(log, safe)
      process.stdout.write(safe)
    }
  })
  stream.on("end", () => {
    if (pending) appendFileSync(log, `${sanitize(pending)}\n`)
  })
}
child.on("error", () => {
  process.exitCode = 1
})
child.on("close", (code, signal) => {
  const status = code ?? 1
  writeFileSync(
    resolve(directory, `${name}.json`),
    JSON.stringify(
      {
        sha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
        dirty:
          execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
            encoding: "utf8",
          }).trim().length > 0,
        run: process.env.GITHUB_RUN_ID || null,
        attempt: process.env.GITHUB_RUN_ATTEMPT || null,
        command: [command, ...args].map(sanitize),
        started,
        finished: new Date().toISOString(),
        exitCode: status,
        signal,
        node: process.version,
      },
      null,
      2,
    ),
  )
  process.exitCode = status
})
