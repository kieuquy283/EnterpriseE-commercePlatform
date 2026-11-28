import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { assertRestrictedStaff, assignedStaffOrderIds } from "../modules/staff-access/policy"

const readAssignedOrderStep = createStep(
  "read-assigned-order",
  async (input: { staffId: string; orderId: string }, { container }) => {
    const staff = await assertRestrictedStaff(container.resolve(Modules.USER), input.staffId)
    // User metadata is writable only by trusted Admin workflows, unlike cart/order metadata.
    if (!assignedStaffOrderIds(staff).includes(input.orderId)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Assigned order not found")
    }
    const orders = container.resolve(Modules.ORDER)
    const order = await orders
      .retrieveOrder(input.orderId, { relations: ["items"] })
      .catch((error: unknown) => {
        if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_FOUND) {
          throw new MedusaError(MedusaError.Types.NOT_FOUND, "Assigned order not found")
        }
        throw error
      })
    return new StepResponse({
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      items: (order.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
      })),
    })
  },
)

export const readStaffOrderWorkflow = createWorkflow(
  "read-staff-order",
  function (input: { staffId: string; orderId: string }) {
    return new WorkflowResponse(readAssignedOrderStep(input))
  },
)
