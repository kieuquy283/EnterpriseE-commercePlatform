import { createHash } from "node:crypto"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import RecommendationModuleService from "../../modules/recommendation/service"
import type { MedusaContainer } from "@medusajs/framework/types"

export type Candidate = {
  version: string
  placement: "home" | "product_detail"
  context_key: string
  target_product_id: string
  score: number
  rank: number
  strategy: string
}
type Input = { version: string; manifest: Record<string, unknown>; candidates: Candidate[] }

export function validateCandidates(input: Input) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(input.version) || !input.candidates.length || input.candidates.length > 100_000) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid version or candidate count")
  }
  const contexts = new Map<string, Candidate[]>()
  for (const row of input.candidates) {
    if (row.version !== input.version || !["home", "product_detail"].includes(row.placement) ||
      !/^prod_[a-zA-Z0-9]+$/.test(row.target_product_id) || !Number.isFinite(row.score) || row.score < 0 ||
      !Number.isInteger(row.rank) || row.rank < 1 || row.rank > 100 ||
      (row.placement === "home" ? row.context_key !== "home" : !/^product:prod_[a-zA-Z0-9]+$/.test(row.context_key)) ||
      row.context_key === `product:${row.target_product_id}` ||
      (row.placement === "product_detail" && row.score > 1) ||
      row.strategy !== (row.placement === "home" ? "hm_purchase_popularity" : "hm_metadata_similarity")) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid candidate")
    }
    const key = `${row.placement}:${row.context_key}`
    const rows = contexts.get(key) || []
    if (rows.length >= 100) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Candidate pool exceeds 100")
    rows.push(row)
    contexts.set(key, rows)
  }
  if (!contexts.has("home:home") || !input.candidates.some((r) => r.placement === "product_detail")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Both placements are required")
  }
  for (const rows of contexts.values()) {
    const sorted = [...rows].sort((a, b) => a.rank - b.rank)
    if (new Set(rows.map((r) => r.target_product_id)).size !== rows.length ||
      sorted.some((r, i) => r.rank !== i + 1 || (i > 0 && r.score > sorted[i - 1].score))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Duplicate target, invalid rank or ordering")
    }
  }
}

const publishStep = createStep("publish", async (input: Input, { container }) => {
  validateCandidates(input)
  const service: RecommendationModuleService = container.resolve("recommendation")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const ids = [...new Set(input.candidates.flatMap((r) => [r.target_product_id, ...(r.placement === "product_detail" ? [r.context_key.slice(8)] : [])]))]
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100)
    const { data } = await query.graph({ entity: "product", fields: ["id"], filters: { id: batch } })
    if (data.length !== batch.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Candidate contains missing Medusa products")
  }
  const checksum = createHash("sha256").update(JSON.stringify(input)).digest("hex")
  const existing = await service.listRecommendationRuns({ version: input.version })
  let run = existing[0]
  if (run && (run.checksum !== checksum || run.status !== "ready")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Version is immutable or a previous publish failed; use a new version")
  }
  if (!run) {
    run = await service.createRecommendationRuns({ version: input.version, checksum, manifest: input.manifest, status: "staging" })
    try {
      for (let offset = 0; offset < input.candidates.length; offset += 100) {
        await service.createRecommendationCandidates(input.candidates.slice(offset, offset + 100).map(({ version: _version, ...row }) => ({ ...row, run_id: run.id })))
      }
      const [, count] = await service.listAndCountRecommendationCandidates({ run_id: run.id }, { take: 1 })
      if (count !== input.candidates.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Incomplete candidate import")
      run = await service.updateRecommendationRuns({ id: run.id, status: "ready" })
    } catch (error) {
      await service.updateRecommendationRuns({ id: run.id, status: "failed" })
      throw error
    }
  }
  // A single-row update makes the entire ready run visible atomically.
  const pointer = await service.listRecommendationActives({ id: "recommendation_active" })
  if (pointer.length) await service.updateRecommendationActives({ id: "recommendation_active", run_id: run.id })
  else await service.createRecommendationActives({ id: "recommendation_active", run_id: run.id })
  return new StepResponse({ run_id: run.id, version: run.version })
})

export const publishRecommendationsWorkflow = createWorkflow("publish-recommendations", (input: Input) => {
  const result = publishStep(input)
  return new WorkflowResponse(result)
})

export async function publishRecommendations(container: MedusaContainer, input: Input) {
  const execution = await publishRecommendationsWorkflow(container).run({ input, throwOnError: false })
  if (execution.errors?.length || !execution.result?.run_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Recommendation publication failed; inspect the active version before retrying")
  }
  return execution.result
}
