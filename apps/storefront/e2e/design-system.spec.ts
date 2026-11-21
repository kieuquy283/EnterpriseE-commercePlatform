import { test, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE } from "./test-helpers"

test("editorial home stays usable across desktop/mobile widths without invalid lists or hydration errors", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|cannot be a descendant|cannot contain a nested/i.test(message.text())
    )
      errors.push(message.text())
  })
  await page.goto("/vn")
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
  await expect(page.locator("#hero-heading")).toBeVisible()
  await expect(page.locator('header img[src="/brand/daymark-swallow.svg"]')).toBeVisible()
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  expect(
    await page
      .locator("li")
      .evaluateAll((items) =>
        items.every((item) => ["UL", "OL", "MENU"].includes(item.parentElement?.tagName ?? "")),
      ),
  ).toBe(true)
  expect(await page.locator('img[src*=".png"]').count()).toBe(0)
  expect(errors).toEqual([])
})

test("home feature and Workday/Daily Essentials photographs load", async ({ page }) => {
  await page.goto("/vn")
  const hero = page.locator('img[src="/collection-art/hero-feature.jpg"]')
  await expect(hero).toBeVisible()
  await expect
    .poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  const heroDetail = page.locator('img[src="/collection-art/hero-detail.jpg"]')
  await expect(heroDetail).toBeVisible()
  await expect
    .poll(() => heroDetail.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)

  for (const [handle, filename] of [
    ["dm-workday", "workday.jpg"],
    ["dm-daily-essentials", "daily-essentials.jpg"],
  ]) {
    const image = page.locator(
      `a[href="/vn/collections/${handle}"] img[src="/collection-art/${filename}"]`,
    )
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeVisible()
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0)
  }
})

test("collection and search routes render the shared Vietnamese commerce controls", async ({
  page,
}) => {
  await page.goto("/vn/collections/dm-workday")
  await expect(page.locator("h1")).toContainText("Workday")
  await expect(page.getByTestId("product-wrapper").first()).toBeVisible()
  await page.goto("/vn/store?q=no-matching-daymark-garment")
  await expect(page.locator("main")).toContainText("Không tìm thấy sản phẩm phù hợp với từ khóa")
  await page.goto("/vn/store?sortBy=price_asc")
  await expect(page.getByTestId("product-wrapper").first()).toBeVisible()
  const prices = await page.getByTestId("product-wrapper").evaluateAll((items) =>
    items
      .map((item) => {
        const text = item.textContent?.match(/([\d.]+)\s*₫/)
        return text ? Number(text[1].replaceAll(".", "")) : null
      })
      .filter((price): price is number => price !== null),
  )
  expect(prices.length).toBeGreaterThan(1)
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

test("reduced-motion preference preserves visible content and purchase navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/vn")
  await expect(page.getByRole("link", { name: "Khám phá ngay", exact: true })).toBeVisible()
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true,
  )
  await page.getByRole("link", { name: "Khám phá ngay", exact: true }).click()
  await expect(page).toHaveURL(/\/vn\/store/)
  await expect(page.getByTestId("product-wrapper").first()).toBeVisible()
})

test("editorial content and catalog links remain visible without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto("/vn")
  await expect(page.locator("#approach-heading")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Ba nhịp sống. Một tủ đồ." })).toBeVisible()
  await expect(page.locator('main a[href="/vn/collections/dm-workday"]').first()).toBeVisible()
  await context.close()
})

test("customer page families retain readable layouts at narrow and wide widths", async ({
  page,
}) => {
  const hydrationErrors: string[] = []
  page.on("pageerror", (error) => {
    if (/hydration|cannot be a descendant|cannot contain a nested/i.test(error.message)) {
      hydrationErrors.push(error.message)
    }
  })
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|cannot be a descendant|cannot contain a nested/i.test(message.text())
    ) {
      hydrationErrors.push(message.text())
    }
  })
  for (const route of [
    "/vn/store",
    "/vn/categories/dm-tees",
    "/vn/collections/dm-workday",
    `/vn/products/${DEFAULT_PRODUCT_HANDLE}`,
    "/vn/cart",
    "/vn/account",
    "/vn/missing-page",
  ]) {
    await page.goto(route)
    for (const [width, height] of [
      [375, 667],
      [768, 1024],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height })
      await expect(page.locator("h1").first()).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} at ${width}px`,
      ).toBe(true)
    }
    expect(hydrationErrors, `${route} hydration errors`).toEqual([])
  }
})

test("skip link and side menu work with a keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto("/vn")
  await page.keyboard.press("Tab")
  const skipLink = page.locator('a[href="#daymark-main"]')
  await expect(skipLink).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/#daymark-main$/)

  await page.getByTestId("nav-menu-button").click()
  await expect(page.getByRole("dialog", { name: "Danh mục" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Danh mục" })).toHaveCount(0)
})

test("hero, catalog, account and purchase actions share one button geometry", async ({ page }) => {
  const styles: {
    radius: string
    font: string
    weight: string
    padding: string
    minHeight: string
  }[] = []
  for (const [route, selector] of [
    ["/vn", 'a[href="/vn/store"].dm-btn-primary'],
    ["/vn/store", 'button[type="submit"]'],
    ["/vn/account", '[data-testid="sign-in-button"]'],
    [`/vn/products/${DEFAULT_PRODUCT_HANDLE}`, '[data-testid="add-product-button"]'],
  ]) {
    await page.goto(route)
    const button = page.locator(selector).first()
    styles.push(
      await button.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          radius: style.borderRadius,
          font: style.fontSize,
          weight: style.fontWeight,
          padding: style.padding,
          minHeight: style.minHeight,
        }
      }),
    )
  }
  expect(styles.every((style) => JSON.stringify(style) === JSON.stringify(styles[0]))).toBe(true)
  expect(styles[0]).toMatchObject({ radius: "0px", minHeight: "48px" })
})
