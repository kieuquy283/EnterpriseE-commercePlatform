import { test, expect } from "@playwright/test"

test.describe("Private recommendation rails", () => {
  test("Home and PDP use bounded priced products, including mobile", async ({ page }) => {
    await page.goto("/vn")
    const popular = page.getByTestId("popular-products")
    if (process.env.RECOMMENDATIONS_EXPECT_ENABLED !== "true") {
      await expect(popular).toBeVisible()
      await expect(popular.getByRole("heading", { name: "Explore products" })).toBeVisible()
      const count = await popular.getByTestId("product-wrapper").count()
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(12)
      await page.goto("/vn/products/ao-thun-essential")
      await expect(page.getByTestId("similar-products")).toHaveCount(0)
      await expect(page.getByRole("heading", { name: "Ao thun Essential", exact: true })).toBeVisible()
      return
    }
    await expect(popular).toBeVisible()
    const count = await popular.getByTestId("product-wrapper").count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(12)
    const first = popular.locator("a").first()
    await first.click()
    const similar = page.getByTestId("similar-products")
    await expect(similar).toBeVisible()
    expect(await similar.getByTestId("product-wrapper").count()).toBeLessThanOrEqual(6)
    const current = new URL(page.url()).pathname
    for (const link of await similar.locator("a").all()) expect(await link.getAttribute("href")).not.toBe(current)
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(similar).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
