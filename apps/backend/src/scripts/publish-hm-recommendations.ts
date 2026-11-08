import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { publishRecommendations, type Candidate } from "../workflows/recommendation/publish"
import RecommendationModuleService from "../modules/recommendation/service"

export default async function publish({ container, args }: ExecArgs) {
  const activate = process.env.RECOMMENDATION_ACTIVATE_VERSION || args.find((arg) => /^(--)?activate=/.test(arg))?.split("=")[1]
  const service: RecommendationModuleService = container.resolve("recommendation")
  if (activate) {
    const [run] = await service.listRecommendationRuns({ version: activate, status: "ready" })
    if (!run) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ready version not found")
    await service.updateRecommendationActives({ id: "recommendation_active", run_id: run.id })
    console.log("Active recommendation version restored")
    return
  }
  const hybrid = Boolean(process.env.HM_HYBRID_ARTIFACT_DIR)
  const root = path.resolve(process.env.HM_HYBRID_ARTIFACT_DIR || process.env.HM_PROCESSED_DIR || "../../data/hm/processed")
  const manifest = JSON.parse(await readFile(path.join(root, hybrid ? "manifest.json" : "mvp-candidate-manifest.json"), "utf8"))
  if (hybrid) {
    const databaseUrl = process.env.DATABASE_URL
    let databaseName = ""
    try { databaseName = decodeURIComponent(new URL(databaseUrl || "").pathname.slice(1)) } catch { /* fail closed */ }
    if (process.env.NODE_ENV !== "test" || !["recommendation_test", "hm_hybrid_test"].includes(databaseName) ||
      process.env.HM_HYBRID_PUBLISH_APPROVED !== "1" || manifest.human_review !== "APPROVED" || manifest.private_rights !== "APPROVED") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Hybrid publish requires an isolated test database and explicit private quality/rights approval")
    }
  }
  const candidates: Candidate[] = []
  for (const name of ["candidates-home.jsonl", "candidates-product-detail.jsonl"]) {
    const text = await readFile(path.join(root, name), "utf8")
    if (hybrid && manifest.candidate_files_sha256?.[name] !== createHash("sha256").update(text).digest("hex")) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Hybrid artifact checksum mismatch")
    }
    candidates.push(...text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)))
  }
  await publishRecommendations(container, { version: manifest.version, manifest, candidates })
  console.log(`Published ${candidates.length} recommendation candidates`)
}
