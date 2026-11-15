import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"

type Input = { cart_id: string; line_item_id: string }

const validateCartItemStep = createStep(
  "validate-cart-item",
  async (input: Input, { container }) => {
    const service = container.resolve(Modules.CART)
    const cart = await service.retrieveCart(input.cart_id, { relations: ["items"] })
    if (!cart.items?.some((item) => item.id === input.line_item_id)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Line item not found in cart")
    }
    return new StepResponse({ cart_id: cart.id, ids: [input.line_item_id] })
  },
)

export const deleteLegacyCartItemWorkflow = createWorkflow(
  "delete-legacy-cart-item",
  (input: Input) => {
    const validated = validateCartItemStep(input)
    const result = deleteLineItemsWorkflow.runAsStep({ input: validated })
    return new WorkflowResponse(result)
  },
)

export const validateCartItemWorkflow = createWorkflow("validate-cart-item", (input: Input) => {
  const validated = validateCartItemStep(input)
  return new WorkflowResponse(validated)
})
