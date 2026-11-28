import { test, expect } from "@playwright/test"
import { DEFAULT_PRODUCT_HANDLE, DEFAULT_PRODUCT_TITLE } from "./test-helpers"

test.describe("E2E-01: Catalog and Product Detail Page", () => {
  test("finds Vietnamese category names with or without accents and explains empty results", async ({
    page,
  }) => {
    for (const query of ["áo thun", "ao thun"]) {
      await page.goto(`/vn/store?q=${encodeURIComponent(query)}`)
      await expect(page.getByTestId("products-list").locator("li").first()).toBeVisible()
    }

    await page.goto("/vn/store?q=xyzabc")
    await expect(page.getByText("Không tìm thấy sản phẩm phù hợp với từ khóa")).toBeVisible()
    await expect(page.getByRole("link", { name: "Xem tất cả sản phẩm" })).toBeVisible()
  })

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

  test("sorts catalog prices in both directions using backend prices", async ({ page }) => {
    const visiblePrices = async () => {
      const labels = await page.getByTestId("products-list").getByTestId("price").allTextContents()
      expect(labels.length).toBeGreaterThan(1)
      return labels.map((label) => Number(label.replace(/[^0-9]/g, "")))
    }

    await page.goto("/vn/store?sortBy=price_asc")
    await expect(page.getByTestId("products-list").getByTestId("price").first()).toBeVisible()
    const ascending = await visiblePrices()
    expect(ascending.every((price, index) => index === 0 || ascending[index - 1] <= price)).toBe(
      true,
    )

    await page.getByLabel("Giá: cao đến thấp").click()
    await expect(page).toHaveURL(/sortBy=price_desc/)
    const descending = await visiblePrices()
    expect(descending.every((price, index) => index === 0 || descending[index - 1] >= price)).toBe(
      true,
    )
  })
})
