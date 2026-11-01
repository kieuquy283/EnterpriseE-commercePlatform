import { test, expect } from "@playwright/test"
import {
  generateTestEmail,
  generateTestPassword,
  DEFAULT_PRODUCT_TITLE,
} from "./test-helpers"
import {
  addProductToCart,
  goToCheckout,
  fillAddress,
  selectDelivery,
  selectPaymentAndReview,
} from "./checkout-flow"

test.describe("Account & Order History (E2E-04, E2E-07, E2E-11)", () => {
  test("E2E-11: Restricts unauthenticated access and validates non-existent order", async ({ page }) => {
    // 1. Unauthenticated /vn/account should display login page
    await page.goto("/vn/account")
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible({ timeout: 15_000 })

    // 2. Accessing non-existent order confirmation returns not found page
    await page.goto("/vn/order/order_invalid_999999/confirmed")
    await expect(page.locator("h1")).toContainText(/Page not found|not found/i, { timeout: 15_000 })
  })

  test("E2E-07: Displays error message on invalid customer login", async ({ page }) => {
    await page.goto("/vn/account")
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible({ timeout: 15_000 })

    // Fill invalid credentials
    await page.locator('[data-testid="email-input"]').fill("nonexistent-customer@example.test")
    await page.locator('[data-testid="password-input"]').fill("WrongPassword123!")
    await page.locator('[data-testid="sign-in-button"]').click()

    // Verify error is shown and user stays on login page
    const loginError = page.locator('[data-testid="login-error-message"]')
    await expect(loginError).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible()
    expect(page.url()).not.toContain("/account/orders")
  })

  test("E2E-04: Registers customer, places COD order, and verifies order in history and details", async ({ page }) => {
    const testEmail = generateTestEmail("cod-member")
    const testPassword = generateTestPassword()

    // 1. Navigate to account and switch to register
    await page.goto("/vn/account")
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible({ timeout: 15_000 })

    const registerSwitchBtn = page.locator('[data-testid="login-page"] [data-testid="register-button"]')
    await registerSwitchBtn.click()
    const registerPage = page.locator('[data-testid="register-page"]')
    await expect(registerPage).toBeVisible({ timeout: 10_000 })

    // Fill registration form
    await registerPage.locator('[data-testid="first-name-input"]').fill("Test")
    await registerPage.locator('[data-testid="last-name-input"]').fill("Customer")
    await registerPage.locator('[data-testid="email-input"]').fill(testEmail)
    await registerPage.locator('[data-testid="phone-input"]').fill("0901234567")
    await registerPage.locator('[data-testid="password-input"]').fill(testPassword)

    const joinBtn = registerPage.locator('button[type="submit"]')
    await joinBtn.click()

    // Wait for registration to complete and refresh account overview
    await page.waitForTimeout(2000)
    await page.goto("/vn/account")

    // Check if registered and logged in
    await expect(page.locator('[data-testid="overview-page-wrapper"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="customer-email"]')).toContainText(testEmail)

    // 2. Add product to cart and checkout
    await addProductToCart(page)
    await goToCheckout(page)

    // 3. Complete checkout steps
    await fillAddress(page, testEmail)
    await selectDelivery(page)
    await selectPaymentAndReview(page)

    // 4. Place order
    const submitOrderBtn = page.locator('[data-testid="submit-order-button"]')
    await expect(submitOrderBtn).toBeEnabled()
    await submitOrderBtn.click()

    // Verify order confirmed page
    await page.waitForURL(/\/vn\/order\/order_[a-zA-Z0-9]+\/confirmed/, { timeout: 30_000 })
    await expect(page.locator('[data-testid="order-complete-container"]')).toBeVisible({ timeout: 15_000 })

    const orderIdDisplay = page.locator('[data-testid="order-id"]')
    await expect(orderIdDisplay).toBeVisible()
    const displayId = (await orderIdDisplay.textContent())?.trim()
    expect(displayId).toBeTruthy()

    // 5. Navigate to Order History
    await page.goto("/vn/account/orders")
    await expect(page.locator('[data-testid="orders-page-wrapper"]')).toBeVisible({ timeout: 15_000 })

    // Verify order card exists with matching display ID
    const orderCard = page.locator('[data-testid="order-card"]').first()
    await expect(orderCard).toBeVisible({ timeout: 15_000 })
    await expect(orderCard.locator('[data-testid="order-display-id"]')).toContainText(displayId!)

    // 6. Navigate to order details
    const detailsLink = orderCard.locator('[data-testid="order-details-link"]')
    await expect(detailsLink).toBeVisible()
    await detailsLink.click()

    // Verify order details page loaded
    await page.waitForURL(/\/vn\/account\/orders\/details\//, { timeout: 15_000 })
    await expect(page.locator('[data-testid="order-details-container"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="product-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-name"]')).toContainText(DEFAULT_PRODUCT_TITLE)
  })
})
