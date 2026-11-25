import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type NotificationOutboxModuleService from "../../modules/notification-outbox/service"

type EnqueueNotificationInput = {
  orderId: string
  sourceEventId: string
  sourceStateVersion: number
  notificationType: "order_placed" | "order_canceled"
  recipient: string
}

const enqueueNotificationStep = createStep(
  "enqueue-notification",
  async (input: EnqueueNotificationInput, { container }) => {
    const service: NotificationOutboxModuleService =
      container.resolve("notificationOutbox")
    const templateVersion = "v1"
    const dedupeKey =
      `${input.orderId}:${input.notificationType}:email:${templateVersion}:` +
      `state-${input.sourceStateVersion}`

    const [existing] = await service.listNotificationRecords({
      dedupe_key: dedupeKey,
    })
    if (existing) {
      return new StepResponse({ notification: existing, duplicate: true })
    }

    try {
      const notification = await service.createNotificationRecords({
        order_id: input.orderId,
        source_event_id: input.sourceEventId,
        source_state_version: input.sourceStateVersion,
        notification_type: input.notificationType,
        channel: "email",
        template_version: templateVersion,
        dedupe_key: dedupeKey,
        recipient: input.recipient,
        state: input.recipient ? "pending" : "failed",
        attempt_count: 0,
        next_attempt_at: input.recipient ? new Date() : null,
        lease_expires_at: null,
        provider_reference: null,
        last_error_code: input.recipient ? null : "missing_recipient",
      })
      return new StepResponse({ notification, duplicate: false })
    } catch (error) {
      const [duplicate] = await service.listNotificationRecords({
        dedupe_key: dedupeKey,
      })
      if (duplicate) {
        return new StepResponse({ notification: duplicate, duplicate: true })
      }
      throw error
    }
  },
)

export const enqueueNotificationWorkflow = createWorkflow(
  "enqueue-notification",
  (input: EnqueueNotificationInput) => {
    const result = enqueueNotificationStep(input)
    return new WorkflowResponse(result)
  },
)
