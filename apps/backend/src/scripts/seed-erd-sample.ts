import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { seedErdSampleWorkflow } from "../workflows/erd-sample"

export default async function seedErdSample({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "ERD sample data is intended for development/test environments.")
  }

  const { result } = await seedErdSampleWorkflow(container).run()
  const manifest = resolve(__dirname, "../../../../docs/erd/evidence/seed-sample/manifest.json")
  await mkdir(dirname(manifest), { recursive: true })
  await writeFile(manifest, JSON.stringify(result, null, 2) + "\n", "utf8")

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`ERD sample ready: customer=${result.customer.id} cart=${result.cart.id}`)
  logger.info(`Manifest: ${manifest}`)
}
