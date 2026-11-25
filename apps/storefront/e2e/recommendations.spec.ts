import { test, expect } from "@playwright/test"

test.describe("Private recommendation rails", () => {
  test("Home and PDP use bounded priced products, including mobile", async ({ page }) => {
    await page.goto("/vn")
    const popular = page.getByTestId("popular-products")
    await expect(popular).toBeVisible()

    const recommendationsEnabled = process.env.RECOMMENDATIONS_EXPECT_ENABLED === "true"
    if (!recommendationsEnabled) {
      await expect(
        popular.getByRole("heading", { name: "Mới trong mùa này", exact: true }),
      ).toBeVisible()
      await expect(
        popular.getByRole("heading", { name: "Gợi ý cho bạn", exact: true }),
      ).toHaveCount(0)
    }

    const cards = popular.getByTestId("product-wrapper")
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(recommendationsEnabled ? 12 : 4)
    const hrefs = await popular
      .locator('a[href*="/products/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
    expect(new Set(hrefs).size).toBe(count)
    for (const card of await cards.all()) await expect(card).toContainText("₫")

    await popular.locator('a[href*="/products/"]').first().click()
    const rail = page.getByTestId(recommendationsEnabled ? "similar-products" : "related-products")
    await expect(rail).toBeVisible()
    if (!recommendationsEnabled) {
      await expect(page.getByTestId("similar-products")).toHaveCount(0)
      await expect(rail.getByRole("heading", { name: "Mới trong mùa này" })).toBeVisible()
    }
    expect(await rail.getByTestId("product-wrapper").count()).toBeLessThanOrEqual(6)
    const current = new URL(page.url()).pathname
    for (const link of await rail.locator('a[href*="/products/"]').all()) {
      expect(await link.getAttribute("href")).not.toBe(current)
    }
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(rail).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  })
})
