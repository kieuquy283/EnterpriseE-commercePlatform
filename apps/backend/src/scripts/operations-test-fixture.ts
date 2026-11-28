// Trusted disposable CI fixture only. Never expose this runner through HTTP.
import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { enqueueNotificationWorkflow } from "../workflows/notification/enqueue-notification"
import { processNotificationWorkflow } from "../workflows/notification/process-notification"
import type NotificationOutboxModuleService from "../modules/notification-outbox/service"

export default async function operationsFixture({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL || "postgresql://invalid")
  assert.equal(process.env.NODE_ENV, "test")
  assert.equal(target.hostname, "localhost")
  assert.equal(target.pathname, "/recommendation_test")
  assert.equal(process.env.DAYMARK_OPERATIONS_TEST, "true")
  const action = process.env.DAYMARK_TEST_ACTION
  const orderId = process.env.DAYMARK_TEST_ORDER_ID || ""
  const order = await container.resolve(Modules.ORDER).retrieveOrder(orderId)
  assert.ok(order.email?.endsWith("@example.invalid"))
  const outbox: NotificationOutboxModuleService = container.resolve("notificationOutbox")
  if (action === "expire") {
    const { result } = await enqueueNotificationWorkflow(container).run({
      input: {
        orderId,
        recipient: order.email!,
        sourceEventId: `order.placed:${orderId}`,
        sourceStateVersion: 1,
        notificationType: "order_placed",
      },
    })
    await outbox.updateNotificationRecords({
      id: result.notification.id,
      state: "processing",
      lease_expires_at: new Date(Date.now() - 1000),
    })
  } else if (action === "process") {
    const [record] = await outbox.listNotificationRecords({
      order_id: orderId,
      notification_type: "order_placed",
    })
    assert.ok(record)
    await processNotificationWorkflow(container).run({ input: { notificationId: record.id } })
  } else if (action === "replay") {
    await container.resolve(Modules.EVENT_BUS).emit({ name: "order.placed", data: { id: orderId } })
  } else {
    assert.equal(action, "inspect")
  }
  const records = await outbox.listNotificationRecords({ order_id: orderId })
  writeFileSync(
    "/ci-private/notification.json",
    JSON.stringify(
      records.map((record) => ({
        id: record.id,
        type: record.notification_type,
        state: record.state,
        attempt_count: record.attempt_count,
        error: record.last_error_code,
        provider_reference: record.provider_reference,
      })),
    ),
    { mode: 0o600 },
  )
}
