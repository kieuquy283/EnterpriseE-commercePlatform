import { model } from "@medusajs/framework/utils"

export default model.define("recommendation_consent", {
  id: model.id({ prefix: "perscons" }).primaryKey(),
  customer_id: model.text().unique(),
  granted: model.boolean().default(false),
  epoch: model.number().default(0),
  terms_version: model.text().nullable(),
}).indexes([{ on: ["customer_id"], unique: true }])
