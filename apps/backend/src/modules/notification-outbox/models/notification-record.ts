import { model } from "@medusajs/framework/utils"

export default model.define("notification_record", {
  id: model.id({ prefix: "ntfy" }).primaryKey(),
  order_id: model.text(),
  source_event_id: model.text(),
  source_state_version: model.number(),
  notification_type: model.enum(["order_placed", "order_canceled"]),
  channel: model.text(),
  template_version: model.text(),
  dedupe_key: model.text().unique(),
  recipient: model.text(),
  state: model.enum(["pending", "processing", "retry_wait", "sent", "failed"]),
  attempt_count: model.number().default(0),
  next_attempt_at: model.dateTime().nullable(),
  lease_expires_at: model.dateTime().nullable(),
  provider_reference: model.text().nullable(),
  last_error_code: model.text().nullable(),
}).indexes([
  { on: ["dedupe_key"], unique: true },
  { on: ["order_id", "source_state_version"] },
  { on: ["state", "next_attempt_at"] },
])
