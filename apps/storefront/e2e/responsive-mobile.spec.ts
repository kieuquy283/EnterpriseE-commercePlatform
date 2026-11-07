import { test, expect } from "@playwright/test"
import {
  generateTestEmail,
  DEFAULT_PRODUCT_HANDLE,
  DEFAULT_PRODUCT_TITLE,
} from "./test-helpers"
import {
  fillAddress,
  selectDelivery,
  selectPaymentAndReview,
  addCurrentProductToCart,
} from "./checkout-flow"

test.describe("Responsive & Mobile View (E2E-12)", () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test("E2E-12: Verifies catalog, PDP, cart, and checkout on mobile viewport", async ({ page }) => {
    // 1. Visit Store catalog on mobile
    await page.goto("/vn/store")
    const productWrapper = page.locator('[data-testid="product-wrapper"]').first()
    await expect(productWrapper).toBeVisible({ timeout: 15_000 })

    // 2. Open PDP
    await page.goto(`/vn/products/${DEFAULT_PRODUCT_HANDLE}`)
    await expect(page.locator('#product-info [data-testid="product-title"]')).toContainText(DEFAULT_PRODUCT_TITLE)

    // Select variant option
    const optionButtons = page.locator('[data-testid="option-button"]')
    if ((await optionButtons.count()) > 0) {
      await optionButtons.first().click()
    }

    // Click add to cart button
    const addBtn = page.locator('[data-testid="add-product-button"]').first()
    await expect(addBtn).toBeEnabled({ timeout: 10_000 })
    await addCurrentProductToCart(page)

    // 3. Navigate to Cart on mobile
    await page.goto("/vn/cart")
    await expect(page.locator('[data-testid="cart-container"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 15_000 })

    // 4. Proceed to Checkout on mobile
    const checkoutBtn = page.locator('[data-testid="checkout-button"]')
    await expect(checkoutBtn).toBeVisible({ timeout: 10_000 })
    await checkoutBtn.click()
    await page.waitForURL(/checkout/, { timeout: 15_000 })

    // Fill address on mobile
    const testEmail = generateTestEmail("cod-mobile")
    await fillAddress(page, testEmail)
    await selectDelivery(page)
    await selectPaymentAndReview(page)

    // Verify Place order button is accessible and enabled on mobile
    const placeOrderBtn = page.locator('[data-testid="submit-order-button"]')
    await expect(placeOrderBtn).toBeVisible({ timeout: 10_000 })
    await expect(placeOrderBtn).toBeEnabled()
  })
})
