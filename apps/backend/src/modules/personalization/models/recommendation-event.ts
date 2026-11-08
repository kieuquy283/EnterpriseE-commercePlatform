import { model } from "@medusajs/framework/utils"

export default model.define("recommendation_event", {
  id: model.id({ prefix: "persevt" }).primaryKey(),
  event_key: model.text().unique(),
  customer_id: model.text(),
  consent_epoch: model.number(),
  event_type: model.enum(["product_view", "recommendation_click", "order_placed", "order_canceled"]),
  product_id: model.text(),
  occurred_at: model.dateTime(),
  placement: model.text().nullable(),
  order_line_key: model.text().nullable(),
}).indexes([
  { on: ["customer_id", "created_at"] },
  { on: ["event_key"], unique: true },
])
