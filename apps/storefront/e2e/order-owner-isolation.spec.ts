import { test, expect, type Page } from "@playwright/test"
import { generateTestEmail, generateTestPassword } from "./test-helpers"
import {
  addProductToCart,
  fillAddress,
  goToCheckout,
  selectDelivery,
  selectPaymentAndReview,
} from "./checkout-flow"

async function registerCustomer(page: Page, email: string) {
  await page.goto("/vn/account")
  await page.getByTestId("register-button").click()
  const form = page.getByTestId("register-page")
  await expect(form).toBeVisible()
  await form.getByTestId("first-name-input").fill("RC1")
  await form.getByTestId("last-name-input").fill("Customer")
  await form.getByTestId("email-input").fill(email)
  await form.getByTestId("phone-input").fill("0901234567")
  await form.getByTestId("password-input").fill(generateTestPassword())
  await form.locator('button[type="submit"]').click()
  await expect(page.getByTestId("overview-page-wrapper")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId("customer-email")).toContainText(email)
}

test("another customer cannot read an order by its ID", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000)
  await page.goto("/vn")
  await expect(page.locator("#hero-heading")).toBeVisible()
  await testInfo.attach("home", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  await page.goto("/vn/store")
  await expect(page.getByTestId("product-wrapper").first()).toBeVisible()
  await testInfo.attach("catalog", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  const ownerEmail = generateTestEmail("rc1-owner")
  await registerCustomer(page, ownerEmail)

  await addProductToCart(page)
  await testInfo.attach("product-and-cart-badge", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  await page.goto("/vn/cart")
  await expect(page.getByTestId("checkout-button")).toBeVisible()
  await testInfo.attach("cart", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  await goToCheckout(page)
  await fillAddress(page, ownerEmail)
  await selectDelivery(page)
  await selectPaymentAndReview(page)
  await testInfo.attach("checkout-review", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  await page.getByTestId("submit-order-button").click()
  await page.waitForURL(/\/vn\/order\/order_[a-zA-Z0-9]+\/confirmed/)
  await expect(page.getByTestId("order-complete-container")).toBeVisible()
  await testInfo.attach("order-confirmation", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  const orderId = page.url().match(/\/order\/(order_[a-zA-Z0-9]+)\/confirmed/)?.[1]
  expect(orderId).toBeTruthy()

  const detailsPath = `/vn/account/orders/details/${orderId}`
  await page.goto(detailsPath)
  await expect(page.getByTestId("order-details-container")).toBeVisible()
  await testInfo.attach("owner-order-details", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  const otherContext = await browser.newContext()
  try {
    const otherPage = await otherContext.newPage()
    const otherEmail = generateTestEmail("rc1-other")
    await registerCustomer(otherPage, otherEmail)
    const ownerToken = (await page.context().cookies()).find(
      (cookie) => cookie.name === "_medusa_jwt",
    )
    const otherToken = (await otherContext.cookies()).find(
      (cookie) => cookie.name === "_medusa_jwt",
    )
    expect(Boolean(ownerToken && otherToken)).toBe(true)
    expect(ownerToken?.value === otherToken?.value).toBe(false)
    await otherPage.goto("/vn/account/orders")
    await expect(otherPage.locator("main")).toContainText(otherEmail)
    await otherPage.goto(detailsPath)
    await expect(otherPage.locator("h1")).toContainText("Trang này đã hết mùa")
    await expect(otherPage.getByTestId("order-details-container")).toHaveCount(0)
    expect(await otherPage.locator("main").textContent()).not.toContain(ownerEmail)
    await testInfo.attach("other-customer-404", {
      body: await otherPage.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  } finally {
    await otherContext.close()
  }
})
