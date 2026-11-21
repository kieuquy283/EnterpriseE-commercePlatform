import { test, expect } from "@playwright/test"

test.describe("Private recommendation rails", () => {
  test("Home and PDP use bounded priced products, including mobile", async ({ page }) => {
    await page.goto("/vn")
    const popular = page.getByTestId("popular-products")
    await expect(popular).toBeVisible()
    if (process.env.RECOMMENDATIONS_EXPECT_ENABLED !== "true") {
      await expect(popular.getByRole("heading", { name: "Mới trong mùa này" })).toBeVisible()
    }
    const count = await popular.getByTestId("product-wrapper").count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(12)
    const first = popular.getByTestId("product-wrapper").first()
    await first.click()
    const rail = page.getByTestId(
      process.env.RECOMMENDATIONS_EXPECT_ENABLED === "true"
        ? "similar-products"
        : "related-products",
    )
    await expect(rail).toBeVisible()
    if (process.env.RECOMMENDATIONS_EXPECT_ENABLED !== "true") {
      await expect(rail.getByRole("heading", { name: "Mới trong mùa này" })).toBeVisible()
    }
    expect(await rail.getByTestId("product-wrapper").count()).toBeLessThanOrEqual(6)
    const current = new URL(page.url()).pathname
    for (const link of await rail.locator("a").all())
      expect(await link.getAttribute("href")).not.toBe(current)
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(rail).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  })
})
