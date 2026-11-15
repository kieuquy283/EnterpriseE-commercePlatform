import { mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { claimLiveAuditOutput, safeDatabaseTarget } from "../provenance"

describe("H&M audit evidence provenance", () => {
  it("records only database host, port and name, excluding credentials and query secrets", () => {
    const target = safeDatabaseTarget("postgres://private-user:private-password@localhost:15432/commerce?password=query-secret&token=private-token")
    expect(target).toEqual({ host: "localhost", port: "15432", name: "commerce" })
    expect(JSON.stringify(target)).not.toMatch(/private|password|secret|token/)
    expect(safeDatabaseTarget("postgresql://localhost/commerce")).toEqual({ host: "localhost", port: "5432", name: "commerce" })
    expect(safeDatabaseTarget("not a database url containing password")).toBeNull()
  })

  describe("immutable run outputs", () => {
    let directory: string
    beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "week5-hm-provenance-")) })
    afterEach(async () => {
      for (const name of await readdir(directory)) await unlink(resolve(directory, name))
      await rmdir(directory)
    })

    it("refuses an existing report without altering its bytes", async () => {
      await writeFile(resolve(directory, "live-audit.json"), "original evidence")
      await expect(claimLiveAuditOutput(directory, { started_at: "new" })).rejects.toThrow("choose a new run directory")
      expect(await readFile(resolve(directory, "live-audit.json"), "utf8")).toBe("original evidence")
      expect(await readdir(directory)).toEqual(["live-audit.json"])
    })

    it("allows existing offline outputs but claims a live attempt exclusively", async () => {
      await writeFile(resolve(directory, "offline-audit.json"), "offline evidence")
      await claimLiveAuditOutput(directory, { started_at: "first" })
      await expect(claimLiveAuditOutput(directory, { started_at: "second" })).rejects.toThrow("choose a new run directory")
      expect(JSON.parse(await readFile(resolve(directory, "live-run.json"), "utf8"))).toEqual({ started_at: "first" })
      expect(await readFile(resolve(directory, "offline-audit.json"), "utf8")).toBe("offline evidence")
    })
  })
})
