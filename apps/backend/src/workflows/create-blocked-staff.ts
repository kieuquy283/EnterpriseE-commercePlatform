import { createUsersWorkflow, setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import {
  createStep,
  StepResponse,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import { blockedStaffAccess } from "../modules/staff-access/policy"

const validateUnlinkedStaffIdentityStep = createStep(
  "validate-unlinked-staff-identity",
  async (input: { email: string; auth_identity_id: string }, { container }) => {
    const identity = await container
      .resolve(Modules.AUTH)
      .retrieveAuthIdentity(input.auth_identity_id, {
        relations: ["provider_identities"],
      })
    if (
      Object.values(identity.app_metadata ?? {}).some((value) => value != null) ||
      !identity.provider_identities?.some((provider) => provider.entity_id === input.email)
    ) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Staff requires an unlinked identity matching its email",
      )
    }
    return new StepResponse(input)
  },
)

// Trusted backend entry point only; never expose as public registration or invite acceptance.
// Creates a new user, so it cannot demote or overwrite the bootstrap Admin.
export const createBlockedStaffWorkflow = createWorkflow(
  "create-blocked-staff",
  function (input: { email: string; auth_identity_id: string }) {
    const validated = validateUnlinkedStaffIdentityStep(input)
    const users = createUsersWorkflow.runAsStep({
      input: {
        users: [{ email: validated.email, metadata: { daymark_admin_access: blockedStaffAccess } }],
      },
    })
    const identity = transform({ input, users }, ({ input, users }) => ({
      authIdentityId: input.auth_identity_id,
      actorType: "user",
      value: users[0].id,
    }))
    setAuthAppMetadataStep(identity)
    return new WorkflowResponse(users)
  },
)
