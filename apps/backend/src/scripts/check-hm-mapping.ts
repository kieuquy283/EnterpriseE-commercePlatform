import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export default async function checkMapping({ container }: ExecArgs) {
  const root = path.resolve(process.env.HM_PROCESSED_DIR || "../../data/hm/processed")
  const text = await readFile(path.join(root, "medusa-mapping.jsonl"), "utf8")
  const rows: { article_id: string; variant_id: string; product_id: string }[] = text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
  if (!rows.length || new Set(rows.map((row) => row.article_id)).size !== rows.length || new Set(rows.map((row) => row.variant_id)).size !== rows.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Empty or duplicate mapping")
  }
  const products = container.resolve(Modules.PRODUCT)
  for (let offset = 0; offset < rows.length; offset += 100) {
    const batch = rows.slice(offset, offset + 100)
    const variants = await products.listProductVariants({ id: batch.map((row) => row.variant_id) }, { select: ["id", "product_id", "sku"], take: 100 })
    const byId = new Map(variants.map((variant) => [variant.id, variant]))
    if (batch.some((row) => byId.get(row.variant_id)?.product_id !== row.product_id || byId.get(row.variant_id)?.sku !== `HM-${row.article_id}`)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Mapping does not match Medusa variants/products/SKUs")
    }
  }
  console.log(JSON.stringify({ verified_mappings: rows.length, products: new Set(rows.map((row) => row.product_id)).size, mapping_sha256: createHash("sha256").update(text).digest("hex") }))
}
