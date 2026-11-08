import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

type Derivative = { path: string; sha256: string }
type ImageRow = {
  article_id: string
  product_id: string
  variant_id: string
  representative: boolean
  status: "valid"
  derivatives: { thumbnail: Derivative; detail: Derivative }
}
type Journal = { key: string; url: string; state: "uploaded" } | {
  key: string; product_id: string; state: "before_update"; thumbnail: string | null; images: { id: string; url: string }[]
} | { key: string; product_id: string; state: "updated" }

const dataRoot = resolve(process.cwd(), "../../data/hm")
const assetRoot = process.env.HM_IMAGE_ASSET_DIR || resolve(dataRoot, "images-optimized")
const inputPath = resolve(process.env.HM_IMAGE_INPUT_DIR || resolve(dataRoot, "processed"), "image-optimized.jsonl")
const journalPath = resolve(process.env.HM_IMAGE_JOURNAL_DIR || resolve(dataRoot, "processed"), "image-import-journal.jsonl")

function readLines<T>(path: string): T[] {
  return readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as T)
}

export function requirePrivateTestTarget() {
  const databaseUrl = process.env.DATABASE_URL
  if (process.env.NODE_ENV !== "test" || process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE !== "1" || !databaseUrl) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "H&M media import requires NODE_ENV=test, explicit local write flag and a test database")
  }
  const url = new URL(databaseUrl)
  if (!/^(recommendation_test|hm_images_test)$/.test(decodeURIComponent(url.pathname.slice(1)))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "H&M media import is restricted to recommendation_test or hm_images_test")
  }
  if (process.env.S3_BUCKET || process.env.S3_FILE_URL) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "H&M media import cannot use cloud file storage in this private test workflow")
  }
  const mediaUrl = process.env.HM_IMAGE_TEST_BACKEND_URL
  if (!mediaUrl || !["127.0.0.1", "localhost"].includes(new URL(mediaUrl).hostname)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "H&M media import requires a loopback-only test media URL")
  }
}

export default async function importHmImages({ container }: ExecArgs) {
  requirePrivateTestTarget()
  if (!existsSync(inputPath)) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Missing image-optimized.jsonl; run validation and optimization first")
  const rows = readLines<ImageRow>(inputPath)
  if (!rows.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "No validated images to import")
  const journal = existsSync(journalPath) ? readLines<Journal>(journalPath) : []
  const uploaded = new Map(journal.filter((row): row is Extract<Journal, { state: "uploaded" }> => row.state === "uploaded")
    .map((row) => [row.key, row.url]))
  const byProduct = new Map<string, ImageRow[]>()
  for (const row of rows) {
    if (!/^\d{10}$/.test(row.article_id) || row.status !== "valid") throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid optimized image manifest")
    byProduct.set(row.product_id, [...(byProduct.get(row.product_id) ?? []), row])
  }
  const productService = container.resolve(Modules.PRODUCT)
  const fileService = container.resolve(Modules.FILE)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  let updated = 0
  for (const [productId, productRows] of byProduct) {
    const [product] = await productService.listProducts({ id: productId }, { relations: ["variants", "images"] })
    if (!product || product.metadata?.source !== "hm_historical_catalog") throw new MedusaError(MedusaError.Types.INVALID_DATA, `Not a mapped H&M Product: ${productId}`)
    const skuToVariantId = new Map(product.variants?.map((variant) => [variant.sku, variant.id]))
    if (productRows.some((row) => skuToVariantId.get(`HM-${row.article_id}`) !== row.variant_id)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Article to Product mapping mismatch: ${productId}`)
    }
    const imageUrls: string[] = []
    let thumbnail = product.thumbnail
    const sortedRows = productRows.sort((a, b) => a.article_id.localeCompare(b.article_id))
    const thumbnailArticleId = (sortedRows.find((row) => row.representative) ?? sortedRows[0]).article_id
    for (const row of sortedRows) {
      for (const kind of ["detail", ...(row.article_id === thumbnailArticleId ? ["thumbnail"] : [])] as const) {
        const derivative = row.derivatives[kind]
        if (!derivative?.path || !/^[a-f0-9]{64}$/.test(derivative.sha256)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid derivative")
        const expected = `${kind}/${row.article_id.slice(0, 3)}/${row.article_id}.jpg`
        if (derivative.path !== expected) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Derivative path mismatch")
        const key = `${row.article_id}:${kind}:${derivative.sha256}`
        let url = uploaded.get(key)
        if (!url) {
          const bytes = readFileSync(resolve(assetRoot, expected))
          const digest = (await import("node:crypto")).createHash("sha256").update(bytes).digest("hex")
          if (digest !== derivative.sha256) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Derivative changed: ${expected}`)
          const file = await fileService.createFiles({
            filename: `hm-${row.article_id}-${kind}-${derivative.sha256.slice(0, 12)}.jpg`,
            mimeType: "image/jpeg", content: bytes.toString("base64"), access: "public",
          })
          const expectedPrefix = `${process.env.HM_IMAGE_TEST_BACKEND_URL!.replace(/\/$/, "")}/static/`
          if (!file.url.startsWith(expectedPrefix)) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "File provider returned an unexpected media URL")
          }
          url = file.url
          appendFileSync(journalPath, JSON.stringify({ state: "uploaded", key, url }) + "\n")
          uploaded.set(key, url)
        }
        if (kind === "detail") imageUrls.push(url)
        if (kind === "thumbnail") thumbnail = url
      }
    }
    const existing = product.images ?? []
    const existingUrls = new Set(existing.map((image) => image.url))
    const toAdd = [...new Set(imageUrls)].filter((url) => !existingUrls.has(url))
    if (thumbnail === product.thumbnail && toAdd.length === 0) continue
    const beforeKey = `before:${productId}`
    if (!journal.some((row) => row.state === "before_update" && row.key === beforeKey)) {
      appendFileSync(journalPath, JSON.stringify({ state: "before_update", key: beforeKey, product_id: productId,
        thumbnail: product.thumbnail, images: existing.map((image) => ({ id: image.id, url: image.url })) }) + "\n")
    }
    await updateProductsWorkflow(container).run({ input: { selector: { id: productId }, update: {
      thumbnail, images: [...existing.map((image) => ({ id: image.id, url: image.url })), ...toAdd.map((url) => ({ url }))],
    } } })
    const [verified] = await productService.listProducts({ id: productId }, { relations: ["images"] })
    if (verified?.thumbnail !== thumbnail || toAdd.some((url) => !verified.images?.some((image) => image.url === url))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Product media readback failed: ${productId}`)
    }
    appendFileSync(journalPath, JSON.stringify({ state: "updated", key: `updated:${productId}`,
      product_id: productId }) + "\n")
    updated++
  }
  logger.info(`H&M image import: ${rows.length} articles, ${updated} Products updated`)
}
