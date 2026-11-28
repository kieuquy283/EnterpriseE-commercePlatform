import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { ILockingModule } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type NotificationOutboxModuleService from "../../modules/notification-outbox/service"
import NotificationSandboxProviderService, {
  isNotificationSandboxDown,
} from "../../modules/notification-sandbox/provider"

type ProcessNotificationInput = { notificationId: string }

function errorCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("notification_provider_down")) {
      return "notification_provider_down"
    }
    if (error.message.includes("notification_provider_test_failure")) {
      return "notification_provider_test_failure"
    }
  }
  return "notification_provider_error"
}

const processNotificationStep = createStep(
  "process-notification",
  async (input: ProcessNotificationInput, { container }) => {
    const service: NotificationOutboxModuleService =
      container.resolve("notificationOutbox")
    const locking = container.resolve<ILockingModule>(Modules.LOCKING)

    const outcome = await locking.execute(
      `notification:${input.notificationId}`,
      async () => {
        const notification = await service.retrieveNotificationRecord(
          input.notificationId,
        )

        if (notification.state === "sent" || notification.state === "failed") {
          return "closed"
        }
        if (
          notification.state === "processing" &&
          notification.lease_expires_at &&
          notification.lease_expires_at > new Date()
        ) {
          return "leased"
        }
        if (
          notification.state !== "processing" &&
          notification.next_attempt_at &&
          notification.next_attempt_at > new Date()
        ) {
          return "waiting"
        }

        await service.updateNotificationRecords({
          id: notification.id,
          state: "processing",
          lease_expires_at: new Date(Date.now() + 2 * 60 * 1000),
        })

        const attemptNumber = notification.attempt_count + 1
        const [existingAttempt] = await service.listNotificationAttempts({
          notification_id: notification.id,
          attempt_number: attemptNumber,
        })

        try {
          const template =
            notification.notification_type === "order_placed"
              ? "order-confirmation"
              : "order-canceled"
          const sandboxProvider = new NotificationSandboxProviderService()
          const result = await sandboxProvider.send({
            to: notification.recipient,
            channel: "email",
            template,
            data: {
              order_id: notification.order_id,
              notification_type: notification.notification_type,
            },
            provider_data: {
              idempotency_key: notification.dedupe_key,
            },
          })

          const providerReference =
            result.id || `sandbox:${notification.dedupe_key}`
          if (existingAttempt) {
            await service.updateNotificationAttempts({
              id: existingAttempt.id,
              outcome: "success",
              error_code: null,
              provider_reference: providerReference,
              attempted_at: new Date(),
            })
          } else {
            await service.createNotificationAttempts({
              notification_id: notification.id,
              attempt_number: attemptNumber,
              outcome: "success",
              error_code: null,
              provider_reference: providerReference,
              attempted_at: new Date(),
            })
          }
          await service.updateNotificationRecords({
            id: notification.id,
            state: "sent",
            attempt_count: attemptNumber,
            next_attempt_at: null,
            lease_expires_at: null,
            provider_reference: providerReference,
            last_error_code: null,
          })
          return "sent"
        } catch (error) {
          const code =
            isNotificationSandboxDown()
              ? "notification_provider_down"
              : errorCode(error)
          if (!existingAttempt) {
            await service.createNotificationAttempts({
              notification_id: notification.id,
              attempt_number: attemptNumber,
              outcome: "failure",
              error_code: code,
              provider_reference: null,
              attempted_at: new Date(),
            })
          }
          if (attemptNumber >= 4) {
            await service.updateNotificationRecords({
              id: notification.id,
              state: "failed",
              attempt_count: attemptNumber,
              next_attempt_at: null,
              lease_expires_at: null,
              provider_reference: null,
              last_error_code: code,
            })
          } else {
            const delayMinutes = [0, 1, 5, 15][attemptNumber] ?? 15
            await service.updateNotificationRecords({
              id: notification.id,
              state: "retry_wait",
              attempt_count: attemptNumber,
              next_attempt_at: new Date(Date.now() + delayMinutes * 60 * 1000),
              lease_expires_at: null,
              provider_reference: null,
              last_error_code: code,
            })
          }
          return "retry_or_failed"
        }
      },
      { timeout: 10, expire: 120 },
    )

    return new StepResponse({ outcome })
  },
)

export const processNotificationWorkflow = createWorkflow(
  "process-notification",
  (input: ProcessNotificationInput) => {
    const result = processNotificationStep(input)
    return new WorkflowResponse(result)
  },
)
