import { mkdtemp, readFile, readdir, rmdir, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"
import { AUDIT_PERSISTENCE_FAILURE, liveEvidenceIO, persistLiveAuditEvidence } from "../evidence"
import type { AuditEvidenceIO } from "../evidence"

const payload = {
  report: { status: "PASS", captured_at: "2026-11-08T00:00:00Z", run: { branch: "week5-test" } },
  mappingCsv: "article_id,status\n00123,PASS\n",
  inventory: { levels: [{ id: "level_a", stocked_quantity: 1, reserved_quantity: 0 }], reservations: [] },
}

function faultableStorage(failAt?: string, failMarker = false) {
  const files = new Map<string, string>()
  const io: AuditEvidenceIO = {
    writeExclusive: async (name, contents) => {
      if (files.has(name)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Existing evidence")
      if (name === failAt || (failMarker && name === "live-audit-incomplete.json")) {
        files.set(name, "partial write")
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Injected storage failure")
      }
      files.set(name, contents)
    },
    publishExclusive: async (pending, final) => {
      expect(files.has("live-mapping.csv")).toBe(true)
      expect(files.has("live-inventory.json")).toBe(true)
      if (failAt === "publish") throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Injected publish failure")
      if (files.has(final)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Existing report")
      files.set(final, files.get(pending)!)
    },
    remove: async name => { files.delete(name) },
  }
  return { io, files }
}

describe("H&M canonical audit result publication", () => {
  it("publishes a complete PASS only after supporting evidence is present", async () => {
    const { io, files } = faultableStorage()
    await persistLiveAuditEvidence(io, payload)
    expect(JSON.parse(files.get("live-audit.json")!)).toEqual(payload.report)
    expect(JSON.parse(files.get("live-inventory.json")!)).toEqual(payload.inventory)
    expect(files.get("live-mapping.csv")).toBe(payload.mappingCsv)
    expect(files.has("live-audit-incomplete.json")).toBe(false)
    expect(files.has(".live-audit.pending.json")).toBe(false)
  })

  it.each(["live-mapping.csv", "live-inventory.json", ".live-audit.pending.json", "publish"])(
    "keeps the run INCOMPLETE and exposes no canonical PASS when %s fails", async failure => {
      const { io, files } = faultableStorage(failure)
      await expect(persistLiveAuditEvidence(io, payload)).rejects.toThrow(AUDIT_PERSISTENCE_FAILURE)
      expect(files.has("live-audit.json")).toBe(false)
      const incomplete = JSON.parse(files.get("live-audit-incomplete.json")!)
      expect(incomplete.status).toBe("INCOMPLETE")
      expect(incomplete.run).toEqual(payload.report.run)
      expect(files.has(failure === "publish" ? ".live-audit.pending.json" : failure)).toBe(true)
    },
  )

  it("still fails without publishing PASS if storage also prevents the incomplete marker", async () => {
    const { io, files } = faultableStorage("live-inventory.json", true)
    await expect(persistLiveAuditEvidence(io, payload)).rejects.toThrow(AUDIT_PERSISTENCE_FAILURE)
    expect(files.has("live-audit.json")).toBe(false)
  })

  it("publishes a valid canonical file through the actual filesystem without leaving a pending file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "week5-hm-evidence-"))
    try {
      await persistLiveAuditEvidence(liveEvidenceIO(directory), payload)
      expect(JSON.parse(await readFile(resolve(directory, "live-audit.json"), "utf8"))).toEqual(payload.report)
      expect((await readdir(directory)).sort()).toEqual(["live-audit.json", "live-inventory.json", "live-mapping.csv"])
    } finally {
      for (const name of await readdir(directory)) await unlink(resolve(directory, name))
      await rmdir(directory)
    }
  })
})
