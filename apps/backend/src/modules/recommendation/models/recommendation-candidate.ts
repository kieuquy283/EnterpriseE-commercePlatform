import { model } from "@medusajs/framework/utils"

export default model.define("recommendation_candidate", {
  id: model.id({ prefix: "recc" }).primaryKey(),
  run_id: model.text(),
  placement: model.enum(["home", "product_detail"]),
  context_key: model.text(),
  target_product_id: model.text(),
  score: model.float(),
  rank: model.number(),
  strategy: model.text(),
}).indexes([
  { on: ["run_id", "placement", "context_key", "target_product_id"], unique: true },
  { on: ["run_id", "placement", "context_key", "rank"], unique: true },
])
