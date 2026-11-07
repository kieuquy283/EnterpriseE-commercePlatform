import { test, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE, DEFAULT_PRODUCT_TITLE } from "./test-helpers"

test.describe("E2E-01: Catalog and Product Detail Page", () => {
  test("displays catalog products and allows viewing and selecting product variants", async ({ page }) => {
    // 1. Open /vn/store catalog
    await page.goto("/vn/store")
    await expect(page).toHaveTitle(/Store|Medusa/i)

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

    const optionButtons = page.locator('[data-testid="option-button"]')
    const optionCount = await optionButtons.count()

    if (optionCount > 0) {
      // Click the first available variant option
      await optionButtons.first().click()
      await expect(addProductButton).toBeEnabled()
      await expect(addProductButton).toContainText(/Add to cart/i)
    } else {
      // If no options to select, button should already be ready
      await expect(addProductButton).toBeEnabled()
    }
  })
})
