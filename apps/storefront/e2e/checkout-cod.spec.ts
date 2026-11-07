import { test, expect } from "@playwright/test"
import { generateTestEmail, DEFAULT_PRODUCT_TITLE } from "./test-helpers"
import {
  addProductToCart,
  goToCheckout,
  fillAddress,
  selectDelivery,
  selectPaymentAndReview,
} from "./checkout-flow"

test.describe("Checkout COD Flow (E2E-03, E2E-05, E2E-06)", () => {
  test("E2E-05: Blocks checkout when required fields are missing", async ({ page }) => {
    // 1. Add product to cart and go to checkout
    await addProductToCart(page)
    await goToCheckout(page)

    // 2. Clear or submit with empty fields
    const submitAddressBtn = page.locator('[data-testid="submit-address-button"]')
    await expect(submitAddressBtn).toBeVisible()

    // Clear email or leave fields empty and attempt to submit
    const emailInput = page.locator('[data-testid="shipping-email-input"]')
    await emailInput.fill("")
    await submitAddressBtn.click()

    // Expect to remain on address step and not proceed to delivery
    expect(page.url()).not.toContain("step=delivery")
    await expect(page.locator('[data-testid="delivery-options-container"]')).toHaveCount(0)
  })

  test("E2E-03: Completes checkout with Cash on Delivery (COD) as guest", async ({ page }) => {
    const testEmail = generateTestEmail("cod-guest")

    // 1. Add product to cart and enter checkout
    await addProductToCart(page)
    await goToCheckout(page)

    // 2. Fill Address step
    await fillAddress(page, testEmail)

    // 3. Select Delivery option
    await selectDelivery(page)

    // 4. Select COD Payment & proceed to Review
    await selectPaymentAndReview(page)

    // 5. Place order
    const submitOrderBtn = page.locator('[data-testid="submit-order-button"]')
    await expect(submitOrderBtn).toBeEnabled()
    await submitOrderBtn.click()

    // 6. Verify navigation to Order Confirmed page
    await page.waitForURL(/\/vn\/order\/order_[a-zA-Z0-9]+\/confirmed/, { timeout: 30_000 })
    const confirmedUrl = page.url()
    const orderIdMatch = confirmedUrl.match(/order_[a-zA-Z0-9]+/)
    expect(orderIdMatch).toBeTruthy()

    // 7. Verify confirmation UI
    const orderCompleteContainer = page.locator('[data-testid="order-complete-container"]')
    await expect(orderCompleteContainer).toBeVisible({ timeout: 15_000 })
    await expect(orderCompleteContainer).toContainText(/Thank you/i)
    await expect(orderCompleteContainer).toContainText(DEFAULT_PRODUCT_TITLE)

    // Verify order email and display number
    const orderEmailDisplay = page.locator('[data-testid="order-email"]')
    await expect(orderEmailDisplay).toContainText(testEmail)

    const orderIdDisplay = page.locator('[data-testid="order-id"]')
    await expect(orderIdDisplay).toBeVisible()
    const displayId = await orderIdDisplay.textContent()
    expect(Number(displayId)).toBeGreaterThan(0)
  })

  test("E2E-06: Displays error when place order server action fails", async ({ page }) => {
    const testEmail = generateTestEmail("cod-fail")

    // 1. Add product to cart and reach review step
    await addProductToCart(page)
    await goToCheckout(page)
    await fillAddress(page, testEmail)
    await selectDelivery(page)
    await selectPaymentAndReview(page)

    // 2. Intercept server action call to simulate placeOrder failure
    await page.route("**/checkout**", async (route) => {
      const request = route.request()
      if (request.method() === "POST" && request.headers()["next-action"]) {
        await route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "Simulated order placement error",
        })
      } else {
        await route.continue()
      }
    })

    // 3. Click Place order
    const submitOrderBtn = page.locator('[data-testid="submit-order-button"]')
    await submitOrderBtn.click()

    // 4. Verify user stays on checkout and error message is displayed
    await expect(page).toHaveURL(/checkout/)
    expect(page.url()).not.toContain("/confirmed")

    const errorMessage = page.locator('[data-testid="payment-error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 10_000 })
    await expect(errorMessage).toContainText("Simulated order placement error")
  })
})
