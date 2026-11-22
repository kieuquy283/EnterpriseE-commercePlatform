import type {
  NotificationTypes,
} from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"

let sandboxDown = false

export function setNotificationSandboxDown(down: boolean) {
  sandboxDown = down
}

export function isNotificationSandboxDown() {
  return sandboxDown || process.env.NOTIFICATION_SANDBOX_DOWN === "true"
}

class NotificationSandboxProviderService extends AbstractNotificationProviderService {
  static identifier = "sandbox"
  private deliveredKeys = new Set<string>()

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO,
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const idempotencyKey =
      notification.provider_data?.idempotency_key
    if (typeof idempotencyKey !== "string" || !idempotencyKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Notification sandbox requires an idempotency key",
      )
    }

    if (isNotificationSandboxDown()) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "notification_provider_down",
      )
    }

    if (notification.provider_data?.force_failure === true) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "notification_provider_test_failure",
      )
    }

    if (this.deliveredKeys.has(idempotencyKey)) {
      return { id: `sandbox:${idempotencyKey}` }
    }

    this.deliveredKeys.add(idempotencyKey)
    return { id: `sandbox:${idempotencyKey}` }
  }
}

export default NotificationSandboxProviderService
