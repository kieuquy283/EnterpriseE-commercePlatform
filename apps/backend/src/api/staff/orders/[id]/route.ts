import { MedusaError } from "@medusajs/framework/utils"
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { readStaffOrderWorkflow } from "../../../../workflows/read-staff-order"

const orderId = z.string().regex(/^order_[a-zA-Z0-9]+$/)

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = orderId.safeParse(req.params.id)
  if (!parsedId.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid order ID")
  const { result } = await readStaffOrderWorkflow(req.scope).run({
    input: { staffId: req.auth_context.actor_id, orderId: parsedId.data },
  })
  res.json({ order: result })
}
