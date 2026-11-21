import type { IUserModuleService } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

export const blockedStaffAccess = "blocked_staff"

export async function assertFullAdminAccess(users: IUserModuleService, userId: string) {
  const user = await users.retrieveUser(userId, { select: ["id", "metadata"] })
  if (user.metadata?.daymark_admin_access !== undefined) {
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      "Staff access to the full Admin API is blocked until a restricted surface is available",
    )
  }
}
