import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createApiKeysWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import seedCommerce from "../../src/scripts/seed-commerce"

// Explicit opt-in: Docker k6 is a transient test tool, not a project dependency.
const run = process.env.RUN_LOCAL_K6 === "true" ? describe : describe.skip
jest.setTimeout(180_000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    run("bounded local k6 against fresh Medusa fixtures", () => {
      let key: string
      let regionId: string
      let variantId: string
      let availableBefore: number
      const evidence = process.env.OPS_EVIDENCE_DIR
      async function k6(
        script: string,
        failure = false,
        label = failure ? "negative" : "baseline",
      ) {
        const args = [
          "run",
          "--rm",
          "--network",
          "host",
          "-v",
          `${path.resolve("../../load")}:/scripts:ro`,
          "-e",
          `BASE_URL=${api.defaults.baseURL}`,
          "-e",
          `PUBLISHABLE_KEY=${failure ? "pk_invalid_fixture" : key}`,
          "-e",
          `REGION_ID=${regionId}`,
          "-e",
          `VARIANT_ID=${variantId}`,
          "-e",
          "SMOKE=1",
          "grafana/k6:1.4.2",
          "run",
          `--summary-export=/dev/stdout`,
          `/scripts/${script}.js`,
        ]
        return await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
          const child = spawn("docker", args)
          let output = ""
          child.stdout.on("data", (chunk) => {
            output += chunk
          })
          child.stderr.on("data", (chunk) => {
            output += chunk
          })
          child.on("error", reject)
          child.on("close", (code) => {
            if (evidence) {
              mkdirSync(evidence, { recursive: true })
              // Publishable key is public, but unnecessary in evidence.
              writeFileSync(
                path.join(evidence, `${script}-${label}.txt`),
                output.replaceAll(key, "[publishable-key]"),
              )
            }
            resolve({ code, output })
          })
        })
      }
      beforeAll(async () => {
        const container = getContainer()
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        await createShippingProfilesWorkflow(container).run({
          input: { data: [{ name: "Default", type: "default" }] },
        })
        await seedCommerce({ container, args: [] })
        const { data: channels } = await query.graph({
          entity: "sales_channel",
          fields: ["id"],
          filters: { name: "Online Store" },
        })
        const {
          result: [created],
        } = await createApiKeysWorkflow(container).run({
          input: { api_keys: [{ title: "Isolated k6", type: "publishable", created_by: "" }] },
        })
        key = created.token
        await linkSalesChannelsToApiKeyWorkflow(container).run({
          input: { id: created.id, add: [channels[0].id] },
        })
        const regions = await api.get("/store/regions", {
          headers: { "x-publishable-api-key": key },
        })
        regionId = regions.data.regions.find((r: { name: string }) => r.name === "Vietnam").id
        const products = await api.get(
          `/store/products?handle=ao-thun-essential&region_id=${regionId}`,
          { headers: { "x-publishable-api-key": key } },
        )
        variantId = products.data.products[0].variants[0].id
        const { data: inventory } = await query.graph({
          entity: "inventory_item",
          fields: ["id"],
          filters: { sku: "TEE-ESSENTIAL-BLK" },
        })
        const { data: levels } = await query.graph({
          entity: "inventory_level",
          fields: ["stocked_quantity", "reserved_quantity"],
          filters: { inventory_item_id: inventory[0].id },
        })
        availableBefore = levels.reduce(
          (sum, level) => sum + Number(level.stocked_quantity) - Number(level.reserved_quantity),
          0,
        )
      })
      it("passes catalog mix and one COD intent with retry reconciliation", async () => {
        const catalog = await k6("catalog")
        expect({
          code: catalog.code,
          tail: catalog.code ? catalog.output.slice(-3000) : "",
        }).toEqual({ code: 0, tail: "" })
        const checkout = await k6("checkout")
        expect({
          code: checkout.code,
          tail: checkout.code ? checkout.output.slice(-4000) : "",
        }).toEqual({ code: 0, tail: "" })
        // Authoritative inventory readback remains server-side, never a public load credential.
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: orders } = await query.graph({
          entity: "order",
          fields: ["id", "items.variant_id", "items.quantity", "total", "currency_code"],
          filters: {},
        })
        expect(orders).toHaveLength(1)
        expect(orders[0].items).toHaveLength(1)
        expect(orders[0].items![0]!.variant_id).toBe(variantId)
        expect(Number(orders[0].items![0]!.quantity)).toBe(1)
        const { data: inventory } = await query.graph({
          entity: "inventory_item",
          fields: ["id"],
          filters: { sku: "TEE-ESSENTIAL-BLK" },
        })
        const { data: levels } = await query.graph({
          entity: "inventory_level",
          fields: ["stocked_quantity", "reserved_quantity"],
          filters: { inventory_item_id: inventory[0].id },
        })
        const availableAfter = levels.reduce(
          (sum, level) => sum + Number(level.stocked_quantity) - Number(level.reserved_quantity),
          0,
        )
        expect(availableBefore - availableAfter).toBe(1)
        expect(
          levels.every(
            (level) => Number(level.stocked_quantity) - Number(level.reserved_quantity) >= 0,
          ),
        ).toBe(true)
        if (evidence)
          writeFileSync(
            path.join(evidence, "server-reconciliation.json"),
            JSON.stringify(
              {
                order_count: orders.length,
                line_quantity: Number(orders[0].items![0]!.quantity),
                inventory_nonnegative: true,
                available_before: availableBefore,
                available_after: availableAfter,
              },
              null,
              2,
            ),
          )
      })
      it("fails closed during an isolated database outage and recovers", async () => {
        const ownedContainer = process.env.OPS_LOCAL_POSTGRES_CONTAINER
        if (!ownedContainer || !/^daymark-ops06-pg-[a-z0-9-]+$/.test(ownedContainer)) {
          throw new Error("Explicit owned disposable PostgreSQL container required for fault smoke")
        }
        async function control(action: "pause" | "unpause") {
          await new Promise<void>((resolve, reject) => {
            const child = spawn("docker", [action, ownedContainer!], { stdio: "ignore" })
            child.on("error", reject)
            child.on("close", (code) =>
              code === 0 ? resolve() : reject(new Error(`Local ${action} failed`)),
            )
          })
        }
        await control("pause")
        try {
          const result = await k6("catalog", false, "database-fault")
          expect(result.code).not.toBe(0)
          expect(result.output).toContain("Catalog setup HTTP 0")
        } finally {
          await control("unpause")
        }
        const recovered = await k6("catalog", false, "recovery")
        expect({
          code: recovered.code,
          tail: recovered.code ? recovered.output.slice(-2000) : "",
        }).toEqual({ code: 0, tail: "" })
      })
      it("rejects invalid publishable key before load", async () => {
        const result = await k6("catalog", true)
        expect(result.code).not.toBe(0)
        expect(result.output).toContain("Catalog setup HTTP 400")
      })
    })
  },
})
