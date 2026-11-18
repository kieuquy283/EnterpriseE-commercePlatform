// Collection success is distinct from security approval. No baseline exceptions exist.
import { spawnSync, execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs"
import { createHash } from "node:crypto"

import { pathToFileURL } from "node:url"

const severities = ["info", "low", "moderate", "high", "critical"]
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

// No advisory suppression or risk acceptance is implemented here.
export function evaluateAudit(report, exitCode) {
  const invalid = () => {
    throw new Error("Invalid or inconsistent audit report; release remains UNKNOWN")
  }
  if (
    !record(report) ||
    report.error ||
    report.auditReportVersion !== 2 ||
    !record(report.vulnerabilities) ||
    !record(report.metadata?.vulnerabilities) ||
    ![0, 1].includes(exitCode)
  )
    invalid()
  const counts = report.metadata.vulnerabilities
  const actual = Object.fromEntries(severities.map((severity) => [severity, 0]))
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (
      !record(finding) ||
      finding.name !== name ||
      !severities.includes(finding.severity) ||
      !Array.isArray(finding.via) ||
      finding.via.length === 0 ||
      !Array.isArray(finding.nodes) ||
      finding.nodes.length === 0 ||
      !finding.nodes.every(
        (node) =>
          (typeof node === "string" && node.startsWith("node_modules/")) ||
          (typeof node === "string" && node.includes("/node_modules/")),
      )
    )
      invalid()
    for (const via of finding.via) {
      if (typeof via === "string") {
        if (!Object.hasOwn(report.vulnerabilities, via)) invalid()
      } else if (
        !record(via) ||
        !Number.isInteger(via.source) ||
        typeof via.name !== "string" ||
        typeof via.title !== "string" ||
        typeof via.range !== "string" ||
        !severities.includes(via.severity) ||
        typeof via.url !== "string" ||
        !/^https:\/\/github\.com\/advisories\/GHSA-[a-z0-9-]+$/.test(via.url)
      )
        invalid()
    }
    actual[finding.severity]++
  }
  if (
    ![...severities, "total"].every(
      (key) => Number.isSafeInteger(counts[key]) && counts[key] >= 0,
    ) ||
    severities.some((key) => actual[key] !== counts[key]) ||
    counts.total !== Object.keys(report.vulnerabilities).length ||
    (counts.total === 0 ? exitCode !== 0 : exitCode !== 1)
  )
    invalid()
  return {
    counts,
    releaseVerdict: counts.total ? "BLOCKED" : "AUDIT_CLEAR",
    reason: counts.total
      ? "Unapproved dependency findings remain; no baseline exceptions"
      : "No findings reported in this audit scope; shipped-image and regression review remain required",
  }
}

export const sanitize = (value) =>
  value
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/\b(Bearer\s+)[^\s"',]+/gi, "$1[REDACTED]")
    .replace(/\b((?:_authToken|password|token)["']?\s*[:=]\s*)[^\s,}]+/gi, "$1[REDACTED]")

function main() {
  mkdirSync("ci-evidence", { recursive: true })
  const started = new Date().toISOString()
  let npm = null
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
    scope: process.argv.includes("--production-only")
      ? "production-dependencies"
      : "all-dependencies",
    releaseVerdict: "UNKNOWN",
    collection: "FAIL",
    auditExitCode: null,
    counts: null,
  }
  // A pin failure must not leave a previous run's raw report beside new metadata.
  writeFileSync("ci-evidence/audit.json", "")
  writeFileSync("ci-evidence/audit-stderr.log", "")
  let failure
  try {
    npm = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim()
    metadata.npm = npm
    if (process.version !== "v24.22.1") throw new Error("Audit requires pinned Node 24.22.1")
    if (npm !== "11.12.1") throw new Error("Audit requires pinned npm 11.12.1")
    const result = spawnSync(
      "npm",
      [
        "audit",
        ...(process.argv.includes("--production-only") ? ["--omit=dev"] : ["--include=dev"]),
        "--include=optional",
        "--include=peer",
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
    Object.assign(metadata, evaluateAudit(report, result.status))
    metadata.collection = "PASS"
  } catch (error) {
    failure = sanitize(error.message)
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
  if (metadata.releaseVerdict !== "AUDIT_CLEAR") console.log(`::warning::${message}`)
  // Collection-only is explicit and cannot turn a collection failure into success.
  process.exitCode =
    failure ||
    ((!process.argv.includes("--collect-only") || process.argv.includes("--enforce")) &&
      metadata.releaseVerdict !== "AUDIT_CLEAR")
      ? 1
      : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
