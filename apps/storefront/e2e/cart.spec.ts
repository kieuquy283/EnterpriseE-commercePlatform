import { test, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE, DEFAULT_PRODUCT_TITLE } from "./test-helpers"
import { addCurrentProductToCart } from "./checkout-flow"

test.describe("Cart Operations (E2E-02 & E2E-10)", () => {
  test("E2E-10: Displays empty cart state and returns 404 for checkout without cart", async ({ page }) => {
    await page.goto("/vn/cart")
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(0)

    const response = await page.goto("/vn/checkout")
    expect(response?.status()).toBe(404)
  })

  test("E2E-02: Adds product to cart, updates quantity, and removes item", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()))
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message))

    // 1. Navigate to PDP
    await page.goto(`/vn/products/${DEFAULT_PRODUCT_HANDLE}`)
    await expect(page.locator('#product-info [data-testid="product-title"]')).toContainText(DEFAULT_PRODUCT_TITLE)

    // Select variant option if available
    const optionButtons = page.locator('[data-testid="option-button"]')
    if ((await optionButtons.count()) > 0) {
      await optionButtons.first().click()
    }

    const addProductBtn = page.locator('[data-testid="add-product-button"]').first()
    await expect(addProductBtn).toBeEnabled()
    await addCurrentProductToCart(page)

    // 2. Navigate to /vn/cart
    await page.goto("/vn/cart")
    await expect(page.locator('[data-testid="cart-container"]')).toBeVisible({ timeout: 15_000 })

    const productRows = page.locator('[data-testid="product-row"]')
    await expect(productRows.first()).toBeVisible({ timeout: 15_000 })
    await expect(productRows.first().locator('[data-testid="product-title"]')).toContainText(DEFAULT_PRODUCT_TITLE)

    // 3. Verify checkout button exists
    const checkoutButton = page.locator('[data-testid="checkout-button"]')
    await expect(checkoutButton).toBeVisible()

    // 4. Update quantity
    const quantitySelect = productRows.first().locator('[data-testid="product-select-button"]')
    await expect(quantitySelect).toBeVisible()
    const cartAction = (response: import("@playwright/test").Response) =>
      response.url().includes("/vn/cart") &&
      response.request().method() === "POST" &&
      Boolean(response.request().headers()["next-action"])
    const [quantityResponse] = await Promise.all([
      page.waitForResponse(cartAction),
      quantitySelect.selectOption("2"),
    ])
    expect(quantityResponse.ok()).toBeTruthy()

    // Verify quantity updates or total updates
    await expect(quantitySelect).toHaveValue("2", { timeout: 15_000 })

    // 5. Delete line item
    const deleteButton = productRows.first().locator("button").first()
    await expect(deleteButton).toBeVisible()
    const [deleteResponse] = await Promise.all([
      page.waitForResponse(cartAction),
      deleteButton.click(),
    ])
    expect(deleteResponse.ok()).toBeTruthy()

    // Verify empty cart state is displayed
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(0)
  })
})
