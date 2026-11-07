import { expect, test } from "@playwright/test"

const sourceHandle = process.env.HM_IMAGE_CONTEXT_HANDLE
const targetHandle = process.env.HM_IMAGE_TARGET_HANDLE

test("Home shows a compact introduction and real product images", async ({ page }) => {
  test.skip(!sourceHandle, "Requires an isolated H&M image context")
  await page.goto("/vn")
  await expect(page.getByRole("heading", { name: "Find something you'll love" })).toBeVisible()
  const products = page.getByTestId("popular-products")
  await expect(products).toBeVisible()
  const image = products.locator("img").first()
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
})

test("Similar Products card and target PDP load the mapped JPEG", async ({ page }) => {
  test.skip(!sourceHandle || !targetHandle, "Requires an isolated H&M image fixture context")
  await page.goto(`/vn/products/${sourceHandle}`)
  await expect(page.getByTestId("product-title").first()).toBeVisible()
  const rail = page.getByTestId("similar-products")
  await expect(rail).toBeVisible()
  const target = rail.locator(`a[href="/vn/products/${targetHandle}"]`).first()
  await expect(target).toBeVisible()
  const image = target.locator("img")
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
  await target.click()
  await expect(page).toHaveURL(new RegExp(`/vn/products/${targetHandle}$`))
  const galleryImage = page.locator('[id^="img_"] img').first()
  await expect(galleryImage).toBeVisible()
  await expect.poll(() => galleryImage.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
})

test("Store search results load the mapped product thumbnail", async ({ page }) => {
  test.skip(!sourceHandle, "Requires an isolated H&M image context")
  await page.goto("/vn/store?q=Strap%20top")
  const card = page.locator(`a[href="/vn/products/${sourceHandle}"]`).first()
  await expect(card).toBeVisible()
  const image = card.locator("img")
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
})

test("broken mapped JPEG falls back to placeholders in card and gallery", async ({ page }) => {
  test.skip(!sourceHandle || !targetHandle, "Requires an isolated H&M image fixture context")
  await page.route("**/static/**", (route) => route.abort())
  await page.goto(`/vn/products/${sourceHandle}`)
  const card = page.getByTestId("similar-products").locator(`a[href="/vn/products/${targetHandle}"]`).first()
  await expect(card).toBeVisible()
  await expect(card.getByRole("img", { name: "Product thumbnail" })).toBeVisible()
  await page.goto(`/vn/products/${targetHandle}`)
  await expect(page.getByRole("img", { name: "Product image 1" }).first()).toBeVisible()
  await expect(page.getByTestId("add-product-button").first()).toBeVisible()
})
