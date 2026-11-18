// Invoked only from the OPS-01 disposable copy by Medusa exec.
import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import { readCatalogSnapshot } from "../apps/backend/src/scripts/daymark-catalog/snapshot"

export default async function checkFixture({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL || "postgresql://invalid")
  const runDir = process.env.TEST_ENVIRONMENT_RUN_DIR || ""
  assert.equal(process.env.NODE_ENV, "test")
  assert.equal(target.hostname, "localhost")
  assert.equal(target.pathname, "/daymark_test")
  assert.match(runDir, /^\/tmp\/daymark-test-[a-zA-Z0-9]+$/)
  const before = await readCatalogSnapshot(container)
  assert.ok(before.region && before.salesChannelId && before.stockLocation)
  const products = before.products.filter((product) => product.handle.startsWith("dm-"))
  assert.equal(products.length, 30)
  assert.ok(products.every((product) => product.status === "published"))
  const images = products.flatMap((product) => product.imageUrls)
  assert.equal(images.length, 30)
  assert.ok(
    images.every((url) => url.startsWith(`${process.env.DAYMARK_LOCAL_IMAGE_BACKEND_URL}/static/`)),
  )

  const state = (snapshot: typeof before) => ({
    products: snapshot.products.sort((a, b) => a.id.localeCompare(b.id)),
    inventory: snapshot.inventoryLevels.sort((a, b) => a.id.localeCompare(b.id)),
  })
  if (process.env.TEST_ENVIRONMENT_FIXTURE_PHASE === "before") {
    const item = before.inventoryItems.find((item) => item.sku?.startsWith("DM-"))
    assert.ok(item)
    const level = before.inventoryLevels.find((level) => level.inventoryItemId === item.id)
    assert.ok(level && level.stockedQuantity > 1)
    await updateInventoryLevelsWorkflow(container).run({
      input: {
        updates: [
          {
            id: level.id,
            inventory_item_id: item.id,
            location_id: level.locationId,
            stocked_quantity: level.stockedQuantity - 1,
          },
        ],
      },
    })
    const changed = await readCatalogSnapshot(container)
    writeFileSync(`${runDir}/logs/catalog-before.json`, JSON.stringify(state(changed)))
    console.log(
      "PASS catalog: 30 published products, 30 local demo images; reduced one stock level by 1",
    )
  } else {
    assert.deepEqual(
      JSON.parse(JSON.stringify(state(before))),
      JSON.parse(readFileSync(`${runDir}/logs/catalog-before.json`, "utf8")),
    )
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "invite",
      fields: ["id", "accepted"],
      filters: { email: "ops-bootstrap@example.invalid" },
    })
    assert.equal(data.length, 1)
    assert.equal(data[0].accepted, false)
    writeFileSync(`${runDir}/logs/media-url.txt`, images[0])
    console.log(
      "PASS catalog rerun: same products/images/variants/prices/stock; one pending first-admin invite",
    )
  }
}
