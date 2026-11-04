// LOCAL TEST ONLY: records simulated payment outcomes and never processes money.
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
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

type TestData = {
  week4_outcome: "success" | "fail"
  week4_status: GetPaymentStatusOutput["status"]
}

function readData(value?: Record<string, unknown>): TestData {
  const outcome = value?.week4_outcome
  if (outcome !== "success" && outcome !== "fail") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "week4_outcome must be success or fail"
    )
  }
  const status = value?.week4_status
  if (
    status !== undefined &&
    status !== PaymentSessionStatus.PENDING &&
    status !== PaymentSessionStatus.AUTHORIZED &&
    status !== PaymentSessionStatus.CAPTURED &&
    status !== PaymentSessionStatus.ERROR &&
    status !== PaymentSessionStatus.CANCELED
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid week4_status"
    )
  }
  return {
    week4_outcome: outcome,
    week4_status: status ?? PaymentSessionStatus.PENDING,
  }
}

export default class Week4PaymentProvider extends AbstractPaymentProvider {
  static identifier = "week4"

  constructor(
    container: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    super(container, options)
    if (
      process.env.WEEK4_INVENTORY_TESTS !== "true" ||
      process.env.NODE_ENV === "production"
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Week 4 payment provider requires explicit local test mode"
      )
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const data = readData(input.data)
    return {
      id: randomUUID(),
      status: PaymentSessionStatus.PENDING,
      data: { ...data, week4_status: PaymentSessionStatus.PENDING },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = readData(input.data)
    const status = data.week4_outcome === "fail"
      ? PaymentSessionStatus.ERROR
      : PaymentSessionStatus.AUTHORIZED
    return { status, data: { ...data, week4_status: status } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Fail closed if a recalculation loses the explicit test outcome.
    return { data: readData(input.data) }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = readData(input.data)
    return { data, status: data.week4_status }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...readData(input.data),
        week4_status: PaymentSessionStatus.CAPTURED,
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...readData(input.data),
        week4_status: PaymentSessionStatus.CANCELED,
      },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: { ...readData(input.data), week4_refunded: true } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: readData(input.data) }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: readData(input.data) }
  }

  async getWebhookActionAndData(
    _input: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}
