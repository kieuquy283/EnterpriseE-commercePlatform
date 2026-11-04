import { Page, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE, TEST_ADDRESS } from "./test-helpers"

export async function addProductToCart(page: Page, productHandle = DEFAULT_PRODUCT_HANDLE) {
  await page.goto(`/vn/products/${productHandle}`)
  const optionButtons = page.locator('[data-testid="option-button"]')
  if ((await optionButtons.count()) > 0) {
    await optionButtons.first().click()
  }
  const addBtn = page.locator('[data-testid="add-product-button"]').first()
  await expect(addBtn).toBeEnabled({ timeout: 10_000 })
  await addCurrentProductToCart(page)
}

export async function addCurrentProductToCart(page: Page) {
  const addBtn = page.locator('[data-testid="add-product-button"]').first()
  const [response] = await Promise.all([
    page.waitForResponse((result) => result.request().method() === "POST" && Boolean(result.request().headers()["next-action"]) && result.url().includes("/products/")),
    addBtn.click(),
  ])
  expect(response.ok()).toBeTruthy()
  await response.finished()
  await expect(page.getByTestId("nav-cart-link").first()).toContainText(/Cart \([1-9]\d*\)/)
}

export async function goToCheckout(page: Page) {
  await page.goto("/vn/cart")
  const checkoutBtn = page.locator('[data-testid="checkout-button"]')
  await expect(checkoutBtn).toBeVisible({ timeout: 15_000 })
  await checkoutBtn.click()
  await page.waitForURL(/\/vn\/checkout\?step=address|\/vn\/checkout/, { timeout: 15_000 })
}

export async function fillAddress(
  page: Page,
  email: string,
  overrides: Partial<typeof TEST_ADDRESS> = {}
) {
  const addr = { ...TEST_ADDRESS, ...overrides }

  await page.locator('[data-testid="shipping-first-name-input"]').fill(addr.firstName)
  await page.locator('[data-testid="shipping-last-name-input"]').fill(addr.lastName)
  await page.locator('[data-testid="shipping-address-input"]').fill(addr.address)
  await page.locator('[data-testid="shipping-postal-code-input"]').fill(addr.postalCode)
  await page.locator('[data-testid="shipping-city-input"]').fill(addr.city)

  const countrySelect = page.locator('[data-testid="shipping-country-select"]')
  if (await countrySelect.isVisible()) {
    await countrySelect.selectOption(addr.countryCode)
  }

  const emailInput = page.locator('[data-testid="shipping-email-input"]')
  await emailInput.fill(email)

  const phoneInput = page.locator('[data-testid="shipping-phone-input"]')
  await phoneInput.fill(addr.phone)

  const submitAddressBtn = page.locator('[data-testid="submit-address-button"]')
  await expect(submitAddressBtn).toBeEnabled()
  await submitAddressBtn.click()

  // Wait until URL moves to step=delivery or delivery container appears
  await expect(page.locator('[data-testid="delivery-options-container"]')).toBeVisible({
    timeout: 15_000,
  })
}

export async function selectDelivery(page: Page) {
  const deliveryRadios = page.locator('[data-testid="delivery-option-radio"]')
  await expect(deliveryRadios.first()).toBeVisible({ timeout: 15_000 })
  await deliveryRadios.first().click()

  const submitDeliveryBtn = page.locator('[data-testid="submit-delivery-option-button"]')
  await expect(submitDeliveryBtn).toBeEnabled({ timeout: 10_000 })
  await submitDeliveryBtn.click()

  // Wait until payment container or step=payment appears
  await page.waitForURL(/step=payment/, { timeout: 15_000 })
}

export async function selectPaymentAndReview(page: Page) {
  const submitPaymentBtn = page.locator('[data-testid="submit-payment-button"]')
  await expect(submitPaymentBtn).toBeVisible({ timeout: 15_000 })
  await submitPaymentBtn.click()

  // Wait until step=review appears
  await page.waitForURL(/step=review/, { timeout: 15_000 })
  const submitOrderBtn = page.locator('[data-testid="submit-order-button"]')
  await expect(submitOrderBtn).toBeVisible({ timeout: 15_000 })
}
