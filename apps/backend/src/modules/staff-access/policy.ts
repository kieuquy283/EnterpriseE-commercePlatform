import type { IUserModuleService } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

export const blockedStaffAccess = "blocked_staff"

export async function assertFullAdminAccess(users: IUserModuleService, userId: string) {
  const user = await users.retrieveUser(userId, { select: ["id", "metadata"] })
  if (user.metadata?.daymark_admin_access !== undefined) {
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      "Staff access to the full Admin API is blocked",
    )
  }
}

// This marker grants only the separately authenticated /staff read surface.
export async function assertRestrictedStaff(users: IUserModuleService, userId: string) {
  const user = await users.retrieveUser(userId, { select: ["id", "metadata"] })
  if (user.metadata?.daymark_admin_access !== blockedStaffAccess) {
    throw new MedusaError(MedusaError.Types.FORBIDDEN, "Restricted Staff access required")
  }
  return user
}

export function assignedStaffOrderIds(user: {
  metadata?: Record<string, unknown> | null
}): string[] {
  const ids = user.metadata?.daymark_assigned_order_ids ?? []
  if (
    !Array.isArray(ids) ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !/^order_[a-zA-Z0-9]+$/.test(id))
  ) {
    throw new MedusaError(MedusaError.Types.FORBIDDEN, "Invalid Staff assignment")
  }
  return ids
}
