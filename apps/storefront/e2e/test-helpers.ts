import { randomUUID } from "node:crypto"

export function generateTestEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`
}

export function generateTestPassword(): string {
  return `${randomUUID()}aA1!`
}

export const TEST_ADDRESS = {
  firstName: "Nguyen",
  lastName: "Van A",
  address: "123 Le Loi",
  company: "Test Corp",
  postalCode: "700000",
  city: "Ho Chi Minh",
  province: "Ho Chi Minh",
  countryCode: "vn",
  phone: "0901234567",
}

export const DEFAULT_PRODUCT_HANDLE = "ao-thun-essential"
export const DEFAULT_PRODUCT_TITLE = "Ao thun Essential"
