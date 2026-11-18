import assert from "node:assert/strict"
const target = new URL(process.argv[2])
assert.ok(["localhost", "127.0.0.1"].includes(target.hostname))
assert.equal(target.protocol, "http:")
for (let attempt = 0; attempt < 90; attempt++) {
  try {
    const response = await fetch(target, { signal: AbortSignal.timeout(3000) })
    if (response.status === 200) process.exit(0)
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 2000))
}
console.error(`Readiness timed out: ${target.origin}${target.pathname}`)
process.exitCode = 1
