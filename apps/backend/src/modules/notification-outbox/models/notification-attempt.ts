import { model } from "@medusajs/framework/utils"

export default model.define("notification_attempt", {
  id: model.id({ prefix: "ntat" }).primaryKey(),
  notification_id: model.text(),
  attempt_number: model.number(),
  outcome: model.enum(["success", "failure"]),
  error_code: model.text().nullable(),
  provider_reference: model.text().nullable(),
  attempted_at: model.dateTime(),
}).indexes([
  { on: ["notification_id", "attempt_number"], unique: true },
  { on: ["notification_id", "attempted_at"] },
])
