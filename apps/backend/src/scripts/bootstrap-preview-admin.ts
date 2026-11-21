import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"

// Explicit one-off bootstrap only. ECS injects credentials from Secrets Manager;
// never pass credentials as task command arguments or emit them to task logs.
export default async function bootstrapPreviewAdmin({ container }: ExecArgs) {
  const email = process.env.DAYMARK_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.DAYMARK_BOOTSTRAP_ADMIN_PASSWORD
  const host = process.env.DAYMARK_BOOTSTRAP_DB_HOST
  const database = process.env.DAYMARK_BOOTSTRAP_DB_NAME
  if (
    process.env.DAYMARK_BOOTSTRAP_ADMIN_WRITE !== "1" ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length < 24 ||
    !host ||
    !database ||
    !process.env.DATABASE_URL
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Admin bootstrap requires explicit write, target and secret configuration",
    )
  }
  let target: URL
  try {
    target = new URL(process.env.DATABASE_URL)
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Admin bootstrap database target is invalid",
    )
  }
  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    target.hostname !== host ||
    decodeURIComponent(target.pathname.slice(1)) !== database
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Admin bootstrap database target does not match the approved target",
    )
  }
  const users = container.resolve(Modules.USER)
  const auth = container.resolve(Modules.AUTH)
  // Refuse existing or partially created identities before any mutation. A retry
  // never replaces credentials or grants permissions to an existing customer.
  const existingUsers = await users.listUsers({ email })
  const identities = await auth.listProviderIdentities({ provider: "emailpass", entity_id: email })
  if (existingUsers.length || identities.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Admin bootstrap refused: account or identity already exists; inspect before retry",
    )
  }
  try {
    const registration = await auth.register("emailpass", { body: { email, password } })
    if (!registration.success || !registration.authIdentity) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Registration failed")
    }
    await createUserAccountWorkflow(container).run({
      input: {
        authIdentityId: registration.authIdentity.id,
        userData: { email, first_name: "Preview", last_name: "Administrator" },
      },
    })
    // No identity IDs, email, password, JWT or provider error objects in logs.
    container.resolve(ContainerRegistrationKeys.LOGGER).info("Preview Admin bootstrap completed")
  } catch {
    // Auth registration and account creation are separate operations. Preserve
    // partial state for explicit reconciliation instead of deleting/resetting it.
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Admin bootstrap failed; reconcile account and identity before retry",
    )
  } finally {
    delete process.env.DAYMARK_BOOTSTRAP_ADMIN_PASSWORD
    delete process.env.DAYMARK_BOOTSTRAP_ADMIN_EMAIL
  }
}
