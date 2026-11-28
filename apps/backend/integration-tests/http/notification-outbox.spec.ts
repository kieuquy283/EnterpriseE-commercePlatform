import { asValue } from "@medusajs/framework/awilix"
import processNotificationsJob from "../../src/jobs/process-notifications"
import type { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import type NotificationOutboxModuleService from "../../src/modules/notification-outbox/service"
import { setNotificationSandboxDown } from "../../src/modules/notification-sandbox/provider"
import { enqueueNotificationWorkflow } from "../../src/workflows/notification/enqueue-notification"
import { processNotificationWorkflow } from "../../src/workflows/notification/process-notification"

jest.setTimeout(120_000)

async function getOutbox(container: MedusaContainer) {
  return container.resolve("notificationOutbox") as NotificationOutboxModuleService
}

medusaIntegrationTestRunner({
  env: {
    REDIS_URL: "",
    NOTIFICATION_SANDBOX_DOWN: "false",
  },
  testSuite: ({ getContainer }) => {
    afterEach(() => {
      process.env.NOTIFICATION_SANDBOX_DOWN = "false"
      setNotificationSandboxDown(false)
    })

    it("deduplicates the same event and sends it once", async () => {
      const container = getContainer()
      const outbox = await getOutbox(container)
      const input = {
        orderId: "order_notification_dedupe",
        sourceEventId: "order.placed:order_notification_dedupe",
        sourceStateVersion: 1,
        notificationType: "order_placed" as const,
        recipient: "customer@example.test",
      }

      await enqueueNotificationWorkflow(container).run({ input })
      await enqueueNotificationWorkflow(container).run({ input })

      const records = await outbox.listNotificationRecords({
        dedupe_key: "order_notification_dedupe:order_placed:email:v1:state-1",
      })
      expect(records).toHaveLength(1)

      await processNotificationWorkflow(container).run({
        input: { notificationId: records[0].id },
      })
      await processNotificationWorkflow(container).run({
        input: { notificationId: records[0].id },
      })

      const attempts = await outbox.listNotificationAttempts({
        notification_id: records[0].id,
      })
      expect(attempts).toHaveLength(1)
      expect(attempts[0].outcome).toBe("success")
    })

    it("records provider-down attempts and recovers", async () => {
      const container = getContainer()
      const outbox = await getOutbox(container)
      const orderId = "order_notification_recover"
      setNotificationSandboxDown(true)

      await enqueueNotificationWorkflow(container).run({
        input: {
          orderId,
          sourceEventId: `order.placed:${orderId}`,
          sourceStateVersion: 1,
          notificationType: "order_placed",
          recipient: "recover@example.test",
        },
      })
      const [record] = await outbox.listNotificationRecords({
        order_id: orderId,
      })

      await processNotificationWorkflow(container).run({
        input: { notificationId: record.id },
      })
      const first = await outbox.retrieveNotificationRecord(record.id)
      expect(first.state).toBe("retry_wait")
      expect(first.attempt_count).toBe(1)
      expect(first.last_error_code).toBe("notification_provider_down")

      setNotificationSandboxDown(false)
      await outbox.updateNotificationRecords({
        id: record.id,
        next_attempt_at: new Date(Date.now() - 1000),
      })
      await processNotificationWorkflow(container).run({
        input: { notificationId: record.id },
      })

      const recovered = await outbox.retrieveNotificationRecord(record.id)
      expect(recovered.state).toBe("sent")
      expect(recovered.attempt_count).toBe(2)
      expect(recovered.provider_reference).toContain("sandbox:")

      const attempts = await outbox.listNotificationAttempts({
        notification_id: record.id,
      })
      expect(attempts).toHaveLength(2)
      expect(attempts.map((attempt) => attempt.outcome)).toEqual(["failure", "success"])
    })

    it("reclaims an expired processing lease and serializes concurrent send attempts", async () => {
      const container = getContainer()
      const outbox = await getOutbox(container)
      const { result } = await enqueueNotificationWorkflow(container).run({
        input: {
          orderId: "order_expired_processing",
          sourceEventId: "fixture-expired-processing",
          sourceStateVersion: 1,
          notificationType: "order_placed",
          recipient: "lease@example.test",
        },
      })
      await outbox.updateNotificationRecords({
        id: result.notification.id,
        state: "processing",
        lease_expires_at: new Date(Date.now() - 1000),
      })
      await processNotificationsJob(container)
      await Promise.all(
        [1, 2, 3].map(() =>
          processNotificationWorkflow(container).run({
            input: { notificationId: result.notification.id },
          }),
        ),
      )
      const record = await outbox.retrieveNotificationRecord(result.notification.id)
      expect(record.state).toBe("sent")
      expect(record.attempt_count).toBe(1)
      expect(await outbox.listNotificationAttempts({ notification_id: record.id })).toHaveLength(1)
    })

    it("does not re-open a sent record when attempt-audit persistence fails", async () => {
      const container = getContainer()
      const outbox = await getOutbox(container)
      const { result } = await enqueueNotificationWorkflow(container).run({
        input: {
          orderId: "order_audit_failure",
          sourceEventId: "audit-fault",
          sourceStateVersion: 1,
          notificationType: "order_placed",
          recipient: "audit@example.test",
        },
      })
      const registration = container.registrations.notificationOutbox
      let auditCalls = 0
      const failingOutbox = new Proxy(outbox, {
        get(target, property) {
          if (property === "createNotificationAttempts")
            return async () => {
              auditCalls++
              throw new Error("synthetic_audit_failure")
            }
          return Reflect.get(target, property)
        },
      })
      container.register({ notificationOutbox: asValue(failingOutbox) })
      try {
        await processNotificationWorkflow(container).run({
          container,
          input: { notificationId: result.notification.id },
          throwOnError: false,
        })
        expect(auditCalls).toBe(1)
      } finally {
        container.register({ notificationOutbox: registration })
      }
      const record = await outbox.retrieveNotificationRecord(result.notification.id)
      expect(record.state).toBe("sent")
      expect(record.last_error_code).toBeNull()
      await processNotificationWorkflow(container).run({ input: { notificationId: record.id } })
      expect((await outbox.retrieveNotificationRecord(record.id)).attempt_count).toBe(1)
    })

    it("caps provider failures at four attempts and exposes the final error", async () => {
      const container = getContainer()
      const outbox = await getOutbox(container)
      const orderId = "order_notification_terminal"
      process.env.NOTIFICATION_SANDBOX_DOWN = "true"
      setNotificationSandboxDown(true)

      await enqueueNotificationWorkflow(container).run({
        input: {
          orderId,
          sourceEventId: `order.placed:${orderId}`,
          sourceStateVersion: 1,
          notificationType: "order_placed",
          recipient: "terminal@example.test",
        },
      })
      const [record] = await outbox.listNotificationRecords({
        order_id: orderId,
      })

      for (let attempt = 1; attempt <= 4; attempt++) {
        await outbox.updateNotificationRecords({
          id: record.id,
          next_attempt_at: new Date(Date.now() - 1000),
        })
        await processNotificationWorkflow(container).run({
          input: { notificationId: record.id },
        })
      }

      const terminal = await outbox.retrieveNotificationRecord(record.id)
      expect(terminal.state).toBe("failed")
      expect(terminal.attempt_count).toBe(4)
      expect(terminal.last_error_code).toBe("notification_provider_down")

      const attempts = await outbox.listNotificationAttempts({
        notification_id: record.id,
      })
      expect(attempts).toHaveLength(4)
      expect(attempts.every((attempt) => attempt.outcome === "failure")).toBe(true)
    })
  },
})
