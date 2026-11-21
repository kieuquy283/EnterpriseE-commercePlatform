import type { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"
import bootstrapPreviewAdmin from "../bootstrap-preview-admin"

jest.mock("@medusajs/medusa/core-flows", () => ({ createUserAccountWorkflow: jest.fn() }))

describe("preview Admin bootstrap", () => {
  const originalEnv = process.env
  const users = { listUsers: jest.fn() }
  const auth = { listProviderIdentities: jest.fn(), register: jest.fn() }
  const logger = { info: jest.fn() }
  const run = jest.fn()
  const container = {
    resolve: jest.fn(
      (name) =>
        ({
          [Modules.USER]: users,
          [Modules.AUTH]: auth,
          [ContainerRegistrationKeys.LOGGER]: logger,
        })[name],
    ),
  } as unknown as ExecArgs["container"]
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test@preview.test/commerce",
      DAYMARK_BOOTSTRAP_DB_HOST: "preview.test",
      DAYMARK_BOOTSTRAP_DB_NAME: "commerce",
      DAYMARK_BOOTSTRAP_ADMIN_WRITE: "1",
      DAYMARK_BOOTSTRAP_ADMIN_EMAIL: "admin@example.invalid",
      DAYMARK_BOOTSTRAP_ADMIN_PASSWORD: "synthetic-disposable-test-password",
    }
    users.listUsers.mockResolvedValue([])
    auth.listProviderIdentities.mockResolvedValue([])
    auth.register.mockResolvedValue({ success: true, authIdentity: { id: "auth_test" } })
    run.mockResolvedValue({})
    jest.mocked(createUserAccountWorkflow).mockReturnValue({ run } as never)
  })
  afterEach(() => {
    process.env = originalEnv
  })
  it("refuses mismatched database targets before queries or writes", async () => {
    process.env.DAYMARK_BOOTSTRAP_DB_HOST = "different.test"
    await expect(bootstrapPreviewAdmin({ container } as ExecArgs)).rejects.toThrow(
      "approved target",
    )
    expect(container.resolve).not.toHaveBeenCalled()
  })
  it.each(["user", "identity"])(
    "refuses an existing %s without replacing credentials",
    async (kind) => {
      if (kind === "user") users.listUsers.mockResolvedValue([{ id: "existing" }])
      else auth.listProviderIdentities.mockResolvedValue([{ id: "existing" }])
      await expect(bootstrapPreviewAdmin({ container } as ExecArgs)).rejects.toThrow(
        "already exists",
      )
      expect(auth.register).not.toHaveBeenCalled()
      expect(run).not.toHaveBeenCalled()
    },
  )
  it("links the registered auth identity using the supported account workflow and logs no credentials", async () => {
    await bootstrapPreviewAdmin({ container } as ExecArgs)
    expect(run).toHaveBeenCalledWith({
      input: {
        authIdentityId: "auth_test",
        userData: {
          email: "admin@example.invalid",
          first_name: "Preview",
          last_name: "Administrator",
        },
      },
    })
    expect(logger.info).toHaveBeenCalledWith("Preview Admin bootstrap completed")
    expect(process.env.DAYMARK_BOOTSTRAP_ADMIN_PASSWORD).toBeUndefined()
  })
  it("does not expose provider errors or reset partial state", async () => {
    auth.register.mockRejectedValue(new Error("sensitive-provider-error"))
    await expect(bootstrapPreviewAdmin({ container } as ExecArgs)).rejects.toThrow(
      "reconcile account",
    )
    expect(run).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
  })
})
