import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  inApp: true,
  testSuite: ({ api }) => {
    describe("Health", () => {
      it("serves the container liveness probe without authentication", async () => {
        const response = await api.get("/health")

        expect(response.status).toBe(200)
      })
    })
  },
})
