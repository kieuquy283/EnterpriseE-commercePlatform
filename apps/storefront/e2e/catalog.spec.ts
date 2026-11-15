import { test, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE, DEFAULT_PRODUCT_TITLE } from "./test-helpers"

test.describe("E2E-01: Catalog and Product Detail Page", () => {
  test("displays catalog products and allows viewing and selecting product variants", async ({
    page,
  }) => {
    // 1. Open /vn/store catalog
    await page.goto(`/vn/store?q=${encodeURIComponent(DEFAULT_PRODUCT_TITLE)}`)
    await expect(page).toHaveTitle(/DAYMARK/i)

    // Verify products are listed
    const productWrappers = page.locator('[data-testid="product-wrapper"]')
    await expect(productWrappers.first()).toBeVisible({ timeout: 15_000 })
    const count = await productWrappers.count()
    expect(count).toBeGreaterThan(0)

    // 2. Select product (ao-thun-essential)
    const productLink = page.locator(`a[href*="/products/${DEFAULT_PRODUCT_HANDLE}"]`).first()
    await expect(productLink).toBeVisible()
    await productLink.click()

    // 3. Verify Product Details Page (PDP)
    await expect(page).toHaveURL(new RegExp(`/vn/products/${DEFAULT_PRODUCT_HANDLE}`))
    const productTitle = page.locator('#product-info [data-testid="product-title"]')
    await expect(productTitle).toBeVisible()
    await expect(productTitle).toContainText(DEFAULT_PRODUCT_TITLE)

    // Verify Vietnam currency price is displayed
    const priceElement = page.locator('[data-testid="product-price"]')
    await expect(priceElement).toBeVisible()
    const priceText = await priceElement.textContent()
    expect(priceText).toMatch(/₫|VND/i)

    // 4. Variant Selection
    const addProductButton = page.locator('[data-testid="add-product-button"]')
    await expect(addProductButton).toBeVisible()

    const navigations: string[] = []
    page.on("request", (request) => {
      if (
        request.isNavigationRequest() ||
        (request.headers()["rsc"] === "1" && new URL(request.url()).pathname.includes("/products/"))
      ) {
        navigations.push(request.url())
      }
    })
    for (const group of await page.locator('[data-testid="product-options"]:visible').all()) {
      const option = group.getByTestId("option-button").first()
      await option.click()
      await expect(option).toHaveAttribute("aria-pressed", "true")
    }
    await expect(addProductButton).toBeEnabled()
    await expect(page).toHaveURL(/v_id=variant_/)
    expect(navigations).toEqual([])
    await expect(addProductButton).toContainText("Thêm vào giỏ")
  })
})
