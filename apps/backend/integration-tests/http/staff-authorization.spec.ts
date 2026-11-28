import { randomUUID } from "node:crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createOrderWorkflow,
  createRegionsWorkflow,
  createApiKeysWorkflow,
  createUsersWorkflow,
  setAuthAppMetadataStep,
  updateUsersWorkflow,
} from "@medusajs/medusa/core-flows"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createBlockedStaffWorkflow } from "../../src/workflows/create-blocked-staff"

jest.setTimeout(120_000)

const linkTestUserWorkflow = createWorkflow(
  "link-authorization-test-user",
  function (input: { authIdentityId: string; actorType: string; value: string }) {
    const identity = setAuthAppMetadataStep(input)
    return new WorkflowResponse(identity)
  },
)

medusaIntegrationTestRunner({
  env: { REDIS_URL: "" },
  testSuite: ({ api, getContainer }) => {
    const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
    const denied = {
      response: { status: 403, data: { message: expect.stringContaining("Staff access") } },
    }

    async function registerUser() {
      const email = `authorization-${randomUUID()}@example.invalid`
      const password = `${randomUUID()}aA1!`
      const registration = await api.post("/auth/user/emailpass/register", { email, password })
      const payload = JSON.parse(
        Buffer.from(registration.data.token.split(".")[1], "base64url").toString(),
      )
      return {
        email,
        password,
        authIdentityId: payload.auth_identity_id,
        registration: registration.data.token,
      }
    }

    it("allows a real Admin and blocks persisted Staff across the full Admin API", async () => {
      const container = getContainer()
      const admin = await registerUser()
      const {
        result: [user],
      } = await createUsersWorkflow(container).run({ input: { users: [{ email: admin.email }] } })
      await linkTestUserWorkflow(container).run({
        input: { authIdentityId: admin.authIdentityId, actorType: "user", value: user.id },
      })
      const adminLogin = await api.post("/auth/user/emailpass", {
        email: admin.email,
        password: admin.password,
      })
      const adminConfig = { headers: headers(adminLogin.data.token) }
      const adminSession = await api.post("/auth/session", {}, adminConfig)
      const adminCookie = adminSession.headers["set-cookie"]
        .map((cookie: string) => cookie.split(";")[0])
        .join("; ")
      const adminSessionConfig = { headers: { Cookie: adminCookie } }
      expect((await api.get("/admin/users/me", adminSessionConfig)).status).toBe(200)
      for (const path of [
        "/admin/users/me",
        "/admin/products",
        "/admin/orders",
        "/admin/inventory-items",
        "/admin/users",
        "/admin/api-keys",
      ]) {
        expect((await api.get(path, adminConfig)).status).toBe(200)
      }
      await expect(
        createBlockedStaffWorkflow(container).run({
          input: { email: admin.email, auth_identity_id: admin.authIdentityId },
        }),
      ).rejects.toMatchObject({ message: expect.stringContaining("unlinked identity") })
      expect((await api.get("/admin/users/me", adminConfig)).status).toBe(200)
      const staff = await registerUser()
      const {
        result: [staffUser],
      } = await createBlockedStaffWorkflow(container).run({
        input: { email: staff.email, auth_identity_id: staff.authIdentityId },
      })
      const staffLogin = await api.post("/auth/user/emailpass", {
        email: staff.email,
        password: staff.password,
      })
      const staffConfig = {
        headers: { ...headers(staffLogin.data.token), "x-role": "admin", "x-user-id": user.id },
      }
      const staffSession = await api.post("/auth/session", {}, staffConfig)
      const staffCookie = staffSession.headers["set-cookie"]
        .map((cookie: string) => cookie.split(";")[0])
        .join("; ")
      await expect(
        api.get("/admin/orders", { headers: { Cookie: staffCookie } }),
      ).rejects.toMatchObject(denied)
      for (const path of [
        "/admin/users/me",
        "/admin/products",
        "/admin/orders",
        "/admin/customers",
        "/admin/inventory-items",
        "/admin/users",
        "/admin/api-keys",
      ]) {
        await expect(api.get(path, staffConfig)).rejects.toMatchObject(denied)
      }
      for (const [path, body] of [
        ["/admin/products", { title: "Forbidden" }],
        ["/admin/invites", { email: `forbidden-${randomUUID()}@example.invalid` }],
        [`/admin/users/${staffUser.id}`, { metadata: { daymark_admin_access: null } }],
        ["/admin/api-keys", { title: "Forbidden", type: "secret" }],
        ["/admin/orders/nonexistent/cancel", {}],
        ["/admin/inventory-items/nonexistent/location-levels", {}],
      ] as [string, Record<string, unknown>][]) {
        await expect(api.post(path, body, staffConfig)).rejects.toMatchObject(denied)
      }
      // A JWT issued before a trusted policy change must not retain full Admin access.
      await updateUsersWorkflow(container).run({
        input: { updates: [{ id: user.id, metadata: { daymark_admin_access: "blocked_staff" } }] },
      })
      await expect(api.get("/admin/orders", adminConfig)).rejects.toMatchObject(denied)
      await expect(api.get("/admin/orders", adminSessionConfig)).rejects.toMatchObject(denied)
    })

    it("allows only an assigned read projection and revokes existing Staff sessions", async () => {
      const container = getContainer()
      const account = await registerUser()
      const {
        result: [user],
      } = await createBlockedStaffWorkflow(container).run({
        input: { email: account.email, auth_identity_id: account.authIdentityId },
      })
      const login = await api.post("/auth/user/emailpass", {
        email: account.email,
        password: account.password,
      })
      const config = { headers: headers(login.data.token) }
      const session = await api.post("/auth/session", {}, config)
      const cookie = session.headers["set-cookie"]
        .map((value: string) => value.split(";")[0])
        .join("; ")
      const {
        result: [region],
      } = await createRegionsWorkflow(container).run({
        input: { regions: [{ name: "Staff fixture", currency_code: "vnd", countries: ["vn"] }] },
      })
      const { result: order } = await createOrderWorkflow(container).run({
        input: {
          region_id: region.id,
          currency_code: "vnd",
          email: "private-customer@example.invalid",
          items: [{ title: "Assigned fixture", quantity: 1, unit_price: 100 }],
        },
      })
      const { result: otherOrder } = await createOrderWorkflow(container).run({
        input: {
          region_id: region.id,
          currency_code: "vnd",
          items: [],
          metadata: { daymark_assigned_staff_id: user.id },
        },
      })
      await updateUsersWorkflow(container).run({
        input: {
          updates: [
            {
              id: user.id,
              metadata: {
                daymark_admin_access: "blocked_staff",
                daymark_assigned_order_ids: [order.id],
              },
            },
          ],
        },
      })
      const response = await api.get(`/staff/orders/${order.id}`, { headers: { Cookie: cookie } })
      expect(Object.keys(response.data.order).sort()).toEqual([
        "display_id",
        "id",
        "items",
        "status",
      ])
      expect(JSON.stringify(response.data)).not.toContain("private-customer@example.invalid")
      expect(response.data.order.items[0].title).toBe("Assigned fixture")
      await expect(api.get(`/staff/orders/${otherOrder.id}`, config)).rejects.toMatchObject({
        response: { status: 404 },
      })
      await expect(api.get("/admin/orders", config)).rejects.toMatchObject({
        response: { status: 403 },
      })
      await expect(api.post(`/staff/orders/${order.id}`, {}, config)).rejects.toMatchObject({
        response: { status: 404 },
      })
      await updateUsersWorkflow(container).run({
        input: { updates: [{ id: user.id, metadata: { daymark_admin_access: "revoked_staff" } }] },
      })
      await expect(
        api.get(`/staff/orders/${order.id}`, { headers: { Cookie: cookie } }),
      ).rejects.toMatchObject({ response: { status: 403 } })
      await expect(api.get("/admin/orders", config)).rejects.toMatchObject({
        response: { status: 403 },
      })
    })

    it("rejects customer, unregistered user and tampered JWT escalation", async () => {
      const email = `customer-${randomUUID()}@example.invalid`
      const password = `${randomUUID()}aA1!`
      const customer = await api.post("/auth/customer/emailpass/register", {
        email,
        password,
        app_metadata: { daymark_admin_access: "admin", user_id: "user_forged" },
      })
      const {
        result: [key],
      } = await createApiKeysWorkflow(getContainer()).run({
        input: { api_keys: [{ title: "Authorization test", type: "publishable", created_by: "" }] },
      })
      expect(
        (
          await api.post(
            "/store/customers",
            { email },
            { headers: { ...headers(customer.data.token), "x-publishable-api-key": key.token } },
          )
        ).status,
      ).toBe(200)
      const login = await api.post("/auth/customer/emailpass", { email, password })
      expect(
        (
          await api.get("/store/customers/me", {
            headers: { ...headers(login.data.token), "x-publishable-api-key": key.token },
          })
        ).status,
      ).toBe(200)
      await expect(
        api.get("/admin/users", { headers: headers(login.data.token) }),
      ).rejects.toMatchObject({ response: { status: 401 } })
      const unregistered = await registerUser()
      await expect(
        api.get("/admin/orders", { headers: headers(unregistered.registration) }),
      ).rejects.toMatchObject({ response: { status: 401 } })
      const [head, payload, signature] = unregistered.registration.split(".")
      const forged = {
        ...JSON.parse(Buffer.from(payload, "base64url").toString()),
        actor_id: "user_forged",
        app_metadata: { daymark_admin_access: "admin" },
      }
      const token = `${head}.${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${signature}`
      await expect(api.get("/admin/users", { headers: headers(token) })).rejects.toMatchObject({
        response: { status: 401 },
      })
    })
  },
})
