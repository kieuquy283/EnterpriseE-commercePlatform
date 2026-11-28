import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { assertRestrictedStaff, assignedStaffOrderIds } from "../../../modules/staff-access/policy"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const staff = await assertRestrictedStaff(
    req.scope.resolve(Modules.USER),
    req.auth_context.actor_id,
  )
  res.json({
    staff: { id: req.auth_context.actor_id, assigned_order_ids: assignedStaffOrderIds(staff) },
  })
}
