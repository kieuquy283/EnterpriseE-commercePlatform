import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { requirePrivateTestTarget } from "./import-hm-images"

type PriorMedia = {
  state: "before_update"
  key: string
  product_id: string
  thumbnail: string | null
  images: { id: string; url: string }[]
}

export default async function rollbackHmImages({ container }: ExecArgs) {
  requirePrivateTestTarget()
  if (process.env.HM_IMAGE_ROLLBACK !== "1") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set HM_IMAGE_ROLLBACK=1 for an explicit test media rollback")
  }
  const journalDir = process.env.HM_IMAGE_JOURNAL_DIR || resolve(process.cwd(), "../../data/hm/processed")
  const journalPath = resolve(journalDir, "image-import-journal.jsonl")
  if (!existsSync(journalPath)) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Image import journal missing")
  const records = readFileSync(journalPath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  const prior = records.filter((row): row is PriorMedia => row.state === "before_update")
  const productService = container.resolve(Modules.PRODUCT)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  let restored = 0
  for (const row of prior) {
    const [product] = await productService.listProducts({ id: row.product_id }, { relations: ["images"] })
    if (!product || product.metadata?.source !== "hm_historical_catalog") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Rollback target is not a mapped H&M Product: ${row.product_id}`)
    }
    await updateProductsWorkflow(container).run({ input: { selector: { id: row.product_id }, update: {
      thumbnail: row.thumbnail,
      images: row.images.map((image) => ({ id: image.id, url: image.url })),
    } } })
    const [verified] = await productService.listProducts({ id: row.product_id }, { relations: ["images"] })
    const beforeUrls = row.images.map((image) => image.url).sort()
    const afterUrls = verified?.images?.map((image) => image.url).sort() ?? []
    if (verified?.thumbnail !== row.thumbnail || JSON.stringify(beforeUrls) !== JSON.stringify(afterUrls)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Media rollback readback failed: ${row.product_id}`)
    }
    appendFileSync(journalPath, JSON.stringify({ state: "rolled_back", product_id: row.product_id }) + "\n")
    restored++
  }
  logger.info(`H&M image media rollback: ${restored} Products restored`)
}
