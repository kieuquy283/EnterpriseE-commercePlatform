import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

// Publishable keys are browser-visible identifiers, not secret API credentials.
export default async function printStorefrontKey({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["title", "token"],
    filters: { type: "publishable", title: "Storefront" },
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Seed the commerce data first"
    )
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`Storefront publishable key: ${data[0].token}`)
}
