import { expect, test } from "@playwright/test"

const handle = process.env.HM_IMAGE_TEST_HANDLE

test.describe("H&M image fallback", () => {
  test.skip(!handle, "Set HM_IMAGE_TEST_HANDLE to an imported H&M Product handle")

  for (const width of [1280, 360]) {
    test(`PDP and product cards remain usable without image assets at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(`/vn/products/${handle}`)
      await expect(page.getByTestId("product-title").first()).toBeVisible()
      await expect(page.getByTestId("add-product-button").first()).toBeVisible()
      const cards = page.getByTestId("product-wrapper")
      await expect(cards.first()).toBeVisible()
      await expect(cards.first().getByRole("img", { name: "Product thumbnail" })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
})
