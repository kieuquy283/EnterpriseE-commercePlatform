import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { access, open, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"

export function safeDatabaseTarget(connectionString: string | undefined) {
  if (!connectionString) return null
  try {
    const address = new URL(connectionString)
    if (!["postgres:", "postgresql:"].includes(address.protocol)) return null
    return { host: address.hostname, port: address.port || "5432", name: decodeURIComponent(address.pathname.replace(/^\//, "")) }
  } catch {
    return null
  }
}

function gitValue(root: string, args: string[]) {
  try {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    return null
  }
}

export async function sourceProvenance(root: string, sources: Record<string, string>) {
  const hashes: Record<string, string | null> = {}
  for (const [name, path] of Object.entries(sources)) {
    try {
      hashes[name] = createHash("sha256").update(await readFile(path)).digest("hex")
    } catch {
      hashes[name] = null
    }
  }
  const status = gitValue(root, ["status", "--porcelain", "--untracked-files=normal"])
  return {
    baseline_commit: gitValue(root, ["rev-parse", "HEAD"]),
    branch: gitValue(root, ["branch", "--show-current"]),
    worktree_dirty: status === null ? null : status.length > 0,
    source_sha256: hashes,
  }
}

export async function claimLiveAuditOutput(outputDir: string, run: unknown) {
  for (const name of ["live-run.json", "live-audit.json", "live-audit-incomplete.json", "live-inventory.json", "live-mapping.csv", ".live-audit.pending.json"]) {
    try {
      await access(resolve(outputDir, name))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue
      throw error
    }
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Live audit output already exists; choose a new run directory")
  }
  // Persist the claim even if this process stops midway. A subsequent run
  // must use a new directory and cannot overwrite a partial earlier attempt.
  const handle = await open(resolve(outputDir, "live-run.json"), "wx")
  try {
    await handle.writeFile(JSON.stringify(run, null, 2) + "\n", "utf8")
  } finally {
    await handle.close()
  }
}
