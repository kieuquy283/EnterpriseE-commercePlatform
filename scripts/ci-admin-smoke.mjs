// No traces, screenshots, cookies or authentication responses enter CI artifacts.
import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { chromium, expect } from "@playwright/test"

assert.equal(process.env.GITHUB_ACTIONS, "true")
assert.equal(process.env.RUNNER_ENVIRONMENT, "github-hosted")
assert.match(process.env.CI_CONTAINER_PREFIX || "", /^daymark-ci-[0-9]+-[0-9]+$/)
const credentials = JSON.parse(readFileSync(process.env.CI_ADMIN_CREDENTIALS_FILE, "utf8"))
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})
const context = await browser.newContext({ locale: "en-US" })
const page = await context.newPage()
const errors = []
page.on("pageerror", () => errors.push(true))
const checks = []
const passed = (name) => checks.push({ name, passed: true })
try {
  await page.goto("http://localhost:9000/app/login")
  await page.locator('input[name="email"]').fill(credentials.email)
  await page.locator('input[name="password"]').fill(credentials.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes("/login"))
  passed("Admin browser login")
  for (const [language, heading] of [
    ["Français", "Commandes"],
    ["English", "Orders"],
  ]) {
    await page.goto("http://localhost:9000/app/settings/profile/edit")
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: language, exact: true }).click()
    await page.locator('button[type="submit"]').click()
    await page.waitForURL("**/app/settings/profile")
    await page.goto("http://localhost:9000/app/orders")
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible()
    passed(`Admin language ${language}, navigation and reload`)
  }
  assert.equal(errors.length, 0, "Admin browser must have no uncaught JavaScript errors")
  passed("No uncaught Admin JavaScript errors")
  console.log("PASS: Admin login and English/French translation round trip")
} catch {
  // Playwright call logs can contain filled credentials; never print the raw error.
  console.error("FAIL: Admin compatibility smoke; private browser details withheld")
  process.exitCode = 1
} finally {
  writeFileSync(
    "ci-evidence/admin-compatibility.json",
    JSON.stringify({ checks, passed: process.exitCode !== 1, pageErrors: errors.length }, null, 2),
  )
  await context.close()
  await browser.close()
}
