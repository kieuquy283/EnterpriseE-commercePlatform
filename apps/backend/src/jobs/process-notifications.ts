import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type NotificationOutboxModuleService from "../modules/notification-outbox/service"
import { processNotificationWorkflow } from "../workflows/notification/process-notification"

export default async function processNotificationsJob(container: MedusaContainer) {
  const service: NotificationOutboxModuleService = container.resolve("notificationOutbox")
  const pending = await service.listNotificationRecords(
    { state: "pending" },
    { take: 100, order: { created_at: "ASC" } },
  )
  const retryWait = await service.listNotificationRecords(
    {
      state: "retry_wait",
    },
    { take: 100, order: { next_attempt_at: "ASC" } },
  )

  const processing = await service.listNotificationRecords(
    { state: "processing" },
    { take: 100, order: { lease_expires_at: "ASC" } },
  )

  for (const notification of [...pending, ...retryWait, ...processing]) {
    if (notification.next_attempt_at && notification.next_attempt_at > new Date()) {
      continue
    }
    try {
      await processNotificationWorkflow(container).run({
        input: { notificationId: notification.id },
      })
    } catch {
      container
        .resolve(ContainerRegistrationKeys.LOGGER)
        .error(`Notification processing failed: ${notification.id}`)
    }
  }
}

export const config = {
  name: "process-notifications",
  schedule: "*/10 * * * * *",
}
