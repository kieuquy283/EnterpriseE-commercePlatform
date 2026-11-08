import { model } from "@medusajs/framework/utils"

export default model.define("recommendation_run", {
  id: model.id({ prefix: "recrun" }).primaryKey(),
  version: model.text().unique(),
  checksum: model.text(),
  status: model.enum(["staging", "ready", "failed"]).default("staging"),
  manifest: model.json(),
})
