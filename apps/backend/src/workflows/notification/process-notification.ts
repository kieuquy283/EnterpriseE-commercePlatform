import { MedusaError, Modules } from "@medusajs/framework/utils"
import NotificationSmtpProviderService from "../../modules/notification-smtp/provider"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type NotificationOutboxModuleService from "../../modules/notification-outbox/service"
import NotificationSandboxProviderService, {
  isNotificationSandboxDown,
} from "../../modules/notification-sandbox/provider"

type ProcessNotificationInput = { notificationId: string }

function errorCode(error: unknown): string {
  if (error instanceof Error) {
    for (const code of [
      "notification_smtp_configuration",
      "notification_smtp_unavailable",
      "notification_transport_unconfigured",
    ]) {
      if (error.message.includes(code)) return code
    }
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
    const outcome = await container.resolve(Modules.LOCKING).execute(
      `notification:${input.notificationId}`,
      async (signal) => {
        const service: NotificationOutboxModuleService = container.resolve("notificationOutbox")
        const notification = await service.retrieveNotificationRecord(input.notificationId)

        if (notification.state === "sent" || notification.state === "failed") {
          return { outcome: "closed" }
        }
        if (notification.lease_expires_at && notification.lease_expires_at > new Date()) {
          return { outcome: "leased" }
        }
        if (notification.next_attempt_at && notification.next_attempt_at > new Date()) {
          return { outcome: "waiting" }
        }

        await service.updateNotificationRecords({
          id: notification.id,
          state: "processing",
          lease_expires_at: new Date(Date.now() + 2 * 60 * 1000),
        })

        const attemptNumber = notification.attempt_count + 1
        let providerReference: string
        try {
          const template =
            notification.notification_type === "order_placed"
              ? "order-confirmation"
              : "order-canceled"
          if (signal?.aborted)
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "notification_lock_lost")
          const transport =
            process.env.NOTIFICATION_TRANSPORT ||
            (process.env.NODE_ENV === "production" ? "unconfigured" : "sandbox")
          if (transport !== "smtp" && transport !== "sandbox") {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "notification_transport_unconfigured",
            )
          }
          const sandboxProvider =
            transport === "smtp"
              ? new NotificationSmtpProviderService()
              : new NotificationSandboxProviderService()
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

          providerReference = result.id || `sandbox:${notification.dedupe_key}`
        } catch (error) {
          if (signal?.aborted) throw error
          const code = isNotificationSandboxDown() ? "notification_provider_down" : errorCode(error)
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
          await service.createNotificationAttempts({
            notification_id: notification.id,
            attempt_number: attemptNumber,
            outcome: "failure",
            error_code: code,
            provider_reference: null,
            attempted_at: new Date(),
          })
          return { outcome: "retry_or_failed" }
        }
        // Persistence/audit failures are not SMTP failures. Never re-open a stored sent record.
        if (signal?.aborted)
          throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "notification_lock_lost")
        await service.updateNotificationRecords({
          id: notification.id,
          state: "sent",
          attempt_count: attemptNumber,
          next_attempt_at: null,
          lease_expires_at: null,
          provider_reference: providerReference,
          last_error_code: null,
        })
        await service.createNotificationAttempts({
          notification_id: notification.id,
          attempt_number: attemptNumber,
          outcome: "success",
          error_code: null,
          provider_reference: providerReference,
          attempted_at: new Date(),
        })
        return { outcome: "sent" }
      },
      { timeout: 5, expire: 180 },
    )
    return new StepResponse(outcome)
  },
)

export const processNotificationWorkflow = createWorkflow(
  "process-notification",
  function (input: ProcessNotificationInput) {
    const result = processNotificationStep(input)
    return new WorkflowResponse(result)
  },
)
