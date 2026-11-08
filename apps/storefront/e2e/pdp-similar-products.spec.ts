import { test, expect } from "@playwright/test"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { addProductToCart } from "./checkout-flow"

// Fault cases run only with the explicitly configured, loopback-only test harness.
const faults = process.env.PDP_FAULT_TESTS === "true"
const root = path.resolve(__dirname, "../../../data/hm/processed/pdp-verification")
const setMode = (mode: string) => writeFileSync(path.join(root, "proxy-mode.json"), JSON.stringify({ mode }))

test.describe("PDP similarity contract", () => {
  test.afterEach(() => { if (faults) setMode("normal") })

  if (faults) {
    test("Hybrid strategy renders the correct PDP label and product cards", async ({ page }) => {
      setMode("hybrid")
      const [item] = JSON.parse(readFileSync(path.join(root, "browser-contexts.json"), "utf8"))
      await page.goto(`/vn/products/${item.handle}`)
      const rail = page.locator('[data-testid="similar-products"]:visible')
      await expect(rail.getByRole("heading", { name: "Similar products" })).toBeVisible()
      await expect(rail).toContainText("Based on product attributes and appearance.")
      const hrefs = await rail.locator("a").evaluateAll((items) => items.map((element) => element.getAttribute("href")))
      expect(hrefs.length).toBeGreaterThan(0)
      expect(hrefs.length).toBeLessThanOrEqual(6)
      expect(new Set(hrefs).size).toBe(hrefs.length)
      expect(hrefs).not.toContain(`/vn/products/${item.handle}`)
    })
    for (const mode of ["normal", "duplicates", "empty", "503", "404", "timeout"]) {
      test(`production PDP survives recommendation ${mode}`, async ({ page }) => {
        setMode(mode)
        const contexts = JSON.parse(readFileSync(path.join(root, "browser-contexts.json"), "utf8"))
        await page.goto(`/vn/products/${contexts[0].handle}`)
        await expect(page.getByTestId("product-title").first()).toBeVisible()
        const rail = page.getByTestId(["normal", "duplicates"].includes(mode) ? "similar-products" : "related-products")
        await expect(rail).toBeVisible()
        const links = rail.locator("a")
        const hrefs = await links.evaluateAll((items) => items.map((item) => item.getAttribute("href")))
        expect(hrefs.length).toBeGreaterThan(0)
        expect(hrefs.length).toBeLessThanOrEqual(6)
        expect(new Set(hrefs).size).toBe(hrefs.length)
        expect(hrefs).not.toContain(`/vn/products/${contexts[0].handle}`)
        for (const card of await rail.getByTestId("product-wrapper").all()) await expect(card).toContainText("₫")
        if (mode === "normal") await expect(rail.getByTestId("product-wrapper").first().locator("img, svg").first()).toBeVisible()
        await expect(rail.getByRole("heading", { level: 2 })).toBeVisible()
        await links.first().focus()
        await expect(links.first()).toBeFocused()
        await page.setViewportSize({ width: 360, height: 800 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await expect(page.getByTestId("add-product-button").first()).toBeVisible()
      })
    }

    test("full, sparse, zero H&M contexts and non-H&M PDP retain correct labels", async ({ page }) => {
      setMode("normal")
      const contexts = JSON.parse(readFileSync(path.join(root, "browser-contexts.json"), "utf8"))
      for (const item of [...contexts, { handle: "ao-thun-essential", profile: "non-hm" }]) {
        await page.goto(`/vn/products/${item.handle}`)
        // React streaming temporarily retains a hidden Suspense copy in the DOM.
        const rail = page.locator('[data-testid="similar-products"]:visible')
        await expect(rail).toHaveCount(1)
        await expect(rail).toBeVisible()
        await expect(rail.getByRole("heading", { level: 2 })).toHaveText(item.profile === "full" ? "Similar products" : "You may also like")
        expect(await rail.locator("a").count()).toBeLessThanOrEqual(6)
        await expect(page.getByTestId("add-product-button").first()).toBeVisible()
      }
    })

    test("H&M cart and checkout remain usable when recommendations return 503", async ({ page }) => {
      setMode("503")
      const [item] = JSON.parse(readFileSync(path.join(root, "browser-contexts.json"), "utf8"))
      await addProductToCart(page, item.handle)
      await page.goto("/vn/cart")
      const row = page.getByTestId("product-row").first()
      await expect(row).toBeVisible()
      await expect(row.locator(`a[href="/vn/products/${item.handle}"]`).first()).toBeVisible()
      await page.getByTestId("checkout-button").click()
      await page.waitForURL(/\/vn\/checkout/)
      await expect(page.getByTestId("shipping-first-name-input")).toBeVisible()
    })
  }

  if (process.env.PDP_EXPECT_FRONTEND_OFF === "true") test("frontend flag-off production PDP keeps native related products", async ({ page }) => {
    // This case is selected explicitly against the independently built OFF server.
    await page.goto("/vn/products/ao-thun-essential")
    await expect(page.getByTestId("similar-products")).toHaveCount(0)
    await expect(page.getByTestId("related-products")).toBeVisible()
    expect(await page.getByTestId("related-products").locator("a").count()).toBeLessThanOrEqual(6)
    await expect(page.getByTestId("add-product-button").first()).toBeVisible()
  })
})
