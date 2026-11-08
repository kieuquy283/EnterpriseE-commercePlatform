import { link, unlink, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"

export const AUDIT_PERSISTENCE_FAILURE = "H&M live audit could not persist complete evidence"
const pendingReport = ".live-audit.pending.json"

export type AuditEvidenceIO = {
  writeExclusive: (name: string, contents: string) => Promise<void>
  publishExclusive: (pending: string, final: string) => Promise<void>
  remove: (name: string) => Promise<void>
}

export function liveEvidenceIO(outputDir: string): AuditEvidenceIO {
  return {
    writeExclusive: async (name, contents) => {
      await writeFile(resolve(outputDir, name), contents, { encoding: "utf8", flag: "wx" })
    },
    // A hard link atomically exposes the completed file and refuses an
    // existing target, unlike rename which can overwrite existing evidence.
    publishExclusive: async (pending, final) => { await link(resolve(outputDir, pending), resolve(outputDir, final)) },
    remove: async name => { await unlink(resolve(outputDir, name)) },
  }
}

export async function persistLiveAuditEvidence(io: AuditEvidenceIO, input: {
  report: { captured_at: string, run: unknown } & Record<string, unknown>
  mappingCsv: string
  inventory: unknown
}) {
  const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n"
  try {
    await io.writeExclusive("live-mapping.csv", input.mappingCsv)
    await io.writeExclusive("live-inventory.json", json(input.inventory))
    await io.writeExclusive(pendingReport, json(input.report))
    await io.publishExclusive(pendingReport, "live-audit.json")
  } catch (error) {
    // Failed/partial supporting outputs stay available for diagnosis, but
    // no canonical PASS report is published before all evidence succeeds.
    try {
      await io.writeExclusive("live-audit-incomplete.json", json({
        status: "INCOMPLETE", captured_at: input.report.captured_at,
        capture_finished_at: new Date().toISOString(), run: input.report.run,
        error_type: error instanceof Error ? error.name : "Error",
        message: "Evidence publication failed; no complete audit result is asserted. Use a new run directory after resolving the failure.",
      }))
    } catch {
      // Storage failure can also prevent the incomplete marker. The command
      // still fails, and the immutable run claim prevents a silent retry.
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, AUDIT_PERSISTENCE_FAILURE)
  }
  try {
    await io.remove(pendingReport)
  } catch {
    // Canonical evidence is already complete. A remaining identical pending
    // hard link is harmless and must not turn the successful run incomplete.
  }
}
