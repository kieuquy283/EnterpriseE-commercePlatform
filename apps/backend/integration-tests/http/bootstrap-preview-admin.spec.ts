import { randomUUID } from "node:crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import bootstrapPreviewAdmin from "../../src/scripts/bootstrap-preview-admin"

jest.setTimeout(120_000)

medusaIntegrationTestRunner({
  env: { REDIS_URL: "" },
  testSuite: ({ api, getContainer }) => {
    it("bootstraps an Admin, logs in, reads its own profile, and refuses a credential-reset rerun", async () => {
      const email = `preview-${randomUUID()}@example.invalid`
      const password = `${randomUUID()}aA1!`
      const target = new URL(process.env.DATABASE_URL!)
      const configure = (secret: string) => {
        process.env.DAYMARK_BOOTSTRAP_ADMIN_EMAIL = email
        process.env.DAYMARK_BOOTSTRAP_ADMIN_PASSWORD = secret
        process.env.DAYMARK_BOOTSTRAP_ADMIN_WRITE = "1"
        process.env.DAYMARK_BOOTSTRAP_DB_HOST = target.hostname
        process.env.DAYMARK_BOOTSTRAP_DB_NAME = decodeURIComponent(target.pathname.slice(1))
      }
      try {
        configure(password)
        await bootstrapPreviewAdmin({ container: getContainer(), args: [] })
        const login = await api.post("/auth/user/emailpass", { email, password })
        expect(login.status).toBe(200)
        const profile = await api.get("/admin/users/me", {
          headers: { Authorization: `Bearer ${login.data.token}` },
        })
        expect(profile.status).toBe(200)
        expect(profile.data.user.email).toBe(email)
        configure(`${randomUUID()}changed-password`)
        await expect(
          bootstrapPreviewAdmin({ container: getContainer(), args: [] }),
        ).rejects.toThrow("already exists")
        const repeatedLogin = await api.post("/auth/user/emailpass", { email, password })
        expect(repeatedLogin.status).toBe(200)
      } finally {
        for (const key of [
          "DAYMARK_BOOTSTRAP_ADMIN_EMAIL",
          "DAYMARK_BOOTSTRAP_ADMIN_PASSWORD",
          "DAYMARK_BOOTSTRAP_ADMIN_WRITE",
          "DAYMARK_BOOTSTRAP_DB_HOST",
          "DAYMARK_BOOTSTRAP_DB_NAME",
        ]) {
          delete process.env[key]
        }
      }
    })
  },
})
