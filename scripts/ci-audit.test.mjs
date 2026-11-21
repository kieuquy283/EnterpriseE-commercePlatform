import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { evaluateAudit, sanitize } from "./ci-audit.mjs"

const fixture = JSON.parse(readFileSync(new URL("./fixtures/audit/findings.json", import.meta.url)))
const clean = () => ({
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
})

test("clean scope is audit clear, never release approval", () => {
  assert.equal(evaluateAudit(clean(), 0).releaseVerdict, "AUDIT_CLEAR")
})
test("direct and propagated high findings block without exceptions", () => {
  assert.equal(evaluateAudit(fixture, 1).releaseVerdict, "BLOCKED")
})
for (const severity of ["critical", "moderate", "low", "info"]) {
  test(`${severity} finding cannot silently accept risk`, () => {
    const report = structuredClone(fixture)
    for (const finding of Object.values(report.vulnerabilities)) finding.severity = severity
    report.metadata.vulnerabilities.high = 0
    report.metadata.vulnerabilities[severity] = 2
    assert.equal(evaluateAudit(report, 1).releaseVerdict, "BLOCKED")
  })
}
for (const [name, mutate] of [
  [
    "array vulnerability map",
    (r) => {
      r.vulnerabilities = []
    },
  ],
  [
    "missing metadata",
    (r) => {
      delete r.metadata
    },
  ],
  [
    "unsupported schema",
    (r) => {
      r.auditReportVersion = 3
    },
  ],
  [
    "registry error",
    (r) => {
      r.error = { code: "E503" }
    },
  ],
  [
    "forged zero counts",
    (r) => {
      r.metadata.vulnerabilities = clean().metadata.vulnerabilities
    },
  ],
  [
    "wrong severity aggregate",
    (r) => {
      r.metadata.vulnerabilities.high = 1
    },
  ],
  [
    "unknown severity",
    (r) => {
      r.vulnerabilities.example.severity = "unknown"
    },
  ],
  [
    "dangling dependency",
    (r) => {
      r.vulnerabilities.parent.via = ["missing"]
    },
  ],
  [
    "missing affected paths",
    (r) => {
      r.vulnerabilities.example.nodes = []
    },
  ],
  [
    "invalid advisory",
    (r) => {
      r.vulnerabilities.example.via = [{}]
    },
  ],
]) {
  test(`fails closed for ${name}`, () => {
    const report = structuredClone(fixture)
    mutate(report)
    assert.throws(() => evaluateAudit(report, 1), /UNKNOWN/)
  })
}
test("command failures and contradictory exit codes fail closed", () => {
  for (const code of [null, 2, 127, 0]) assert.throws(() => evaluateAudit(fixture, code))
  assert.throws(() => evaluateAudit(clean(), 1))
})
test("artifact sanitization removes credentials and bearer tokens", () => {
  const output = sanitize(
    "https://user:secret@example.com Bearer private token=private password=private",
  )
  assert.doesNotMatch(output, /secret|private/)
})

test("CLI blocks by default; collection-only preserves blockers and fails on malformed JSON", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const { join, resolve } = await import("node:path")
  const { spawnSync } = await import("node:child_process")
  const directory = mkdtempSync(join(tmpdir(), "daymark-audit-policy-"))
  try {
    mkdirSync(join(directory, "bin"))
    writeFileSync(join(directory, "package-lock.json"), "{}")
    const git = spawnSync("git", ["init", "--quiet", directory])
    assert.equal(git.status, 0)
    const npmPath = join(directory, "bin", "npm")
    const script = resolve("scripts/ci-audit.mjs")
    // Fake only the registry/CLI boundary, never a business service or production test.
    const fakeNpm = (body, status, version = "11.12.1") =>
      writeFileSync(
        npmPath,
        `#!/usr/bin/env node\nif(process.argv[2] === "--version") console.log(${JSON.stringify(version)}); else { process.stdout.write(${JSON.stringify(body)}); process.exitCode=${status} }\n`,
        { mode: 0o755 },
      )
    const run = (args = []) =>
      spawnSync(process.execPath, [script, ...args], {
        cwd: directory,
        env: { PATH: `${join(directory, "bin")}:${process.env.PATH}` },
        encoding: "utf8",
      })
    // main records HEAD, so provide a synthetic, empty local commit.
    assert.equal(
      spawnSync(
        "git",
        [
          "-C",
          directory,
          "-c",
          "user.name=Policy Test",
          "-c",
          "core.hooksPath=/dev/null",
          "-c",
          "commit.gpgsign=false",
          "-c",
          "user.email=policy@example.invalid",
          "commit",
          "--allow-empty",
          "-m",
          "fixture",
        ],
        { env: { PATH: process.env.PATH } },
      ).status,
      0,
    )
    fakeNpm(JSON.stringify(fixture), 1)
    assert.equal(run().status, 1)
    assert.equal(run(["--enforce"]).status, 1)
    assert.equal(run(["--enforce", "--collect-only"]).status, 1)
    assert.equal(run(["--collect-only"]).status, 0)
    assert.equal(
      JSON.parse(readFileSync(join(directory, "ci-evidence/audit-metadata.json"))).releaseVerdict,
      "BLOCKED",
    )
    fakeNpm("not json", 1)
    assert.equal(run(["--collect-only"]).status, 1)
    assert.equal(
      JSON.parse(readFileSync(join(directory, "ci-evidence/audit-metadata.json"))).releaseVerdict,
      "UNKNOWN",
    )
    fakeNpm(JSON.stringify(clean()), 0)
    assert.equal(run().status, 0)
    fakeNpm(JSON.stringify(clean()), 0, "11.19.1")
    assert.equal(run(["--collect-only"]).status, 1)
    assert.equal(
      JSON.parse(readFileSync(join(directory, "ci-evidence/audit-metadata.json"))).releaseVerdict,
      "UNKNOWN",
    )
    assert.equal(readFileSync(join(directory, "ci-evidence/audit.json"), "utf8"), "")
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
