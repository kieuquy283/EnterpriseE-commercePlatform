import type { MedusaContainer } from "@medusajs/framework/types"
import type NotificationOutboxModuleService from "../modules/notification-outbox/service"
import { processNotificationWorkflow } from "../workflows/notification/process-notification"

export default async function processNotificationsJob(
  container: MedusaContainer,
) {
  const service: NotificationOutboxModuleService =
    container.resolve("notificationOutbox")
  const pending = await service.listNotificationRecords({ state: "pending" })
  const retryWait = await service.listNotificationRecords({
    state: "retry_wait",
  })

  for (const notification of [...pending, ...retryWait]) {
    if (
      notification.next_attempt_at &&
      notification.next_attempt_at > new Date()
    ) {
      continue
    }
    await processNotificationWorkflow(container).run({
      input: { notificationId: notification.id },
    })
  }
}

export const config = {
  name: "process-notifications",
  schedule: "* * * * *",
}
