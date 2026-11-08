import { model } from "@medusajs/framework/utils"

export default model.define("recommendation_profile", {
  id: model.id({ prefix: "persprof" }).primaryKey(),
  customer_id: model.text().unique(),
  consent_epoch: model.number(),
  profile_version: model.text(),
  interests: model.json(),
  recent_product_ids: model.json(),
}).indexes([{ on: ["customer_id"], unique: true }])
