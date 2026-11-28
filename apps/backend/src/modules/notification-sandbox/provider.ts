import type {
  NotificationTypes,
} from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"

let sandboxDown = false
// TODO(impl): replace the sandbox with an approved transactional email provider and durable provider-side idempotency — BE-04/OPEN-USR-009.

export function setNotificationSandboxDown(down: boolean) {
  sandboxDown = down
}

export function isNotificationSandboxDown() {
  return sandboxDown || process.env.NOTIFICATION_SANDBOX_DOWN === "true"
}

class NotificationSandboxProviderService extends AbstractNotificationProviderService {
  static identifier = "sandbox"

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

    // The provider contract is deterministic for the sandbox: the same
    // idempotency key always resolves to the same provider reference.
    // This models provider-side dedupe and survives a worker restart.
    return { id: `sandbox:${idempotencyKey}` }
  }
}

export default NotificationSandboxProviderService
