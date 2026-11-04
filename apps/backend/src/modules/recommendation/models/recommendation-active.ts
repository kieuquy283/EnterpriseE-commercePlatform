import { model } from "@medusajs/framework/utils"

// A single fixed-ID row is the atomic pointer. Ready runs are immutable.
export default model.define("recommendation_active", {
  id: model.text().primaryKey(),
  run_id: model.text(),
})
