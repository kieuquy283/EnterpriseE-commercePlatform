// Collection success is distinct from security approval. No baseline exceptions exist.
import { spawnSync, execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs"
import { createHash } from "node:crypto"

mkdirSync("ci-evidence", { recursive: true })
const started = new Date().toISOString()
const npm = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim()
const metadata = {
  sha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirty:
    execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
      encoding: "utf8",
    }).trim().length > 0,
  run: process.env.GITHUB_RUN_ID || null,
  attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  lockSha256: createHash("sha256").update(readFileSync("package-lock.json")).digest("hex"),
  node: process.version,
  npm,
  started,
  releaseVerdict: "UNKNOWN",
  collection: "FAIL",
  auditExitCode: null,
  counts: null,
}
const sanitize = (value) =>
  value
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/\b(Bearer\s+)[^\s"',]+/gi, "$1[REDACTED]")
    .replace(/\b((?:_authToken|password|token)["']?\s*[:=]\s*)[^\s,}]+/gi, "$1[REDACTED]")
let failure
try {
  if (npm !== "11.12.1") throw new Error("Audit requires pinned npm 11.12.1")
  const result = spawnSync(
    "npm",
    [
      "audit",
      "--omit=dev",
      "--json",
      "--registry=https://registry.npmjs.org",
      "--fetch-retries=0",
      "--fetch-timeout=20000",
    ],
    {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: 120000,
    },
  )
  metadata.auditExitCode = result.status
  writeFileSync("ci-evidence/audit-stderr.log", sanitize(result.stderr || ""))
  writeFileSync("ci-evidence/audit.json", sanitize(result.stdout || ""))
  if (result.error || ![0, 1].includes(result.status))
    throw new Error("Audit command failed to collect findings")
  const report = JSON.parse(result.stdout)
  const counts = report.metadata?.vulnerabilities
  if (
    report.error ||
    report.auditReportVersion !== 2 ||
    !report.vulnerabilities ||
    !counts ||
    !["critical", "high", "moderate", "low", "info", "total"].every(
      (key) => Number.isInteger(counts[key]) && counts[key] >= 0,
    )
  ) {
    throw new Error("Unknown audit JSON schema; release remains UNKNOWN")
  }
  metadata.counts = counts
  metadata.collection = "PASS"
  metadata.releaseVerdict = counts.critical || counts.high ? "BLOCKED" : "REVIEW_REQUIRED"
  metadata.reason =
    counts.critical || counts.high
      ? "Critical/high paths are unapproved or runtime UNKNOWN; no accepted baseline exceptions"
      : "No critical/high reported; moderate reachability and full shipped-image review still required"
} catch (error) {
  failure = error.message
  metadata.reason = failure
}
metadata.finished = new Date().toISOString()
writeFileSync("ci-evidence/audit-metadata.json", JSON.stringify(metadata, null, 2))
const message = `Audit collection: ${metadata.collection}; release: ${metadata.releaseVerdict}. ${metadata.reason}.`
console.log(message)
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `\n### Dependency audit\n\n${message}\n\nSee audit artifacts and docs/technical/dependency-security.md. Collection success is not security approval.\n`,
  )
if (metadata.releaseVerdict !== "REVIEW_REQUIRED") console.log(`::warning::${message}`)
// --enforce checks critical/high for an explicitly approved policy; review is still required.
process.exitCode =
  failure || (process.argv.includes("--enforce") && metadata.releaseVerdict !== "REVIEW_REQUIRED")
    ? 1
    : 0
