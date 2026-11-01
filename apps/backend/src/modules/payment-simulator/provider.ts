import { randomUUID } from "node:crypto"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { AbstractPaymentProvider, MedusaError } from "@medusajs/framework/utils"

type SimulatorPaymentData = {
  id: string
  simulated_outcome: boolean
}

function getSimulatorPaymentData(
  data?: Record<string, unknown>
): SimulatorPaymentData {
  if (typeof data?.id !== "string" || typeof data.simulated_outcome !== "boolean") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Payment simulator session data is invalid"
    )
  }

  return {
    id: data.id,
    simulated_outcome: data.simulated_outcome,
  }
}

class SimulatorPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "simulator"

  constructor(container: Record<string, unknown>, options: Record<string, unknown> = {}) {
    super(container, options)

    if (process.env.NODE_ENV === "production") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The payment simulator cannot run in production"
      )
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const outcome = input.data?.simulated_outcome
    if (outcome !== undefined && typeof outcome !== "boolean") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "simulated_outcome must be a boolean"
      )
    }

    const data: SimulatorPaymentData = {
      id: randomUUID(),
      simulated_outcome: outcome ?? true,
    }

    return {
      id: data.id,
      status: "pending",
      data,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = getSimulatorPaymentData(input.data)

    return {
      status: data.simulated_outcome ? "authorized" : "error",
      data,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = getSimulatorPaymentData(input.data)

    return {
      status: data.simulated_outcome ? "authorized" : "error",
      data,
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const data = getSimulatorPaymentData(input.data)

    return { data }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}

export default SimulatorPaymentProviderService
