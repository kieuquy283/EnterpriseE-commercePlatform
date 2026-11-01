import {
  assertSampleCart,
  assertSampleCustomer,
  fixtureEmail,
  fixtureId,
  getMissingSampleItems,
} from "../fixture"
import type {
  DesiredSampleItem,
  SampleCart,
  SampleCustomer,
  SampleItem,
} from "../fixture"

const context = {
  customerId: "cus_sample",
  regionId: "reg_sample",
  salesChannelId: "sc_sample",
}

function makeCustomer(overrides: Partial<SampleCustomer> = {}): SampleCustomer {
  return {
    id: context.customerId,
    email: fixtureEmail,
    has_account: false,
    metadata: { erd_fixture: fixtureId },
    ...overrides,
  }
}

function makeCart(overrides: Partial<SampleCart> = {}): SampleCart {
  return {
    id: "cart_sample",
    customer_id: context.customerId,
    region_id: context.regionId,
    sales_channel_id: context.salesChannelId,
    currency_code: "vnd",
    completed_at: null,
    metadata: { erd_fixture: fixtureId },
    ...overrides,
  }
}

const desired: DesiredSampleItem[] = [
  { variant_id: "variant_shirt", quantity: 2 },
  { variant_id: "variant_bag", quantity: 1 },
]

describe("sample customer ownership", () => {
  it("accepts the dedicated customer profile without an account", () => {
    expect(() => assertSampleCustomer(makeCustomer())).not.toThrow()
  })

  it.each([
    ["missing ownership metadata", { metadata: null }],
    ["another fixture marker", { metadata: { erd_fixture: "another-fixture" } }],
    ["a different email", { email: "another-sample@example.test" }],
    ["an existing registered account", { has_account: true }],
    ["an unknown account status", { has_account: undefined }],
  ] satisfies [string, Partial<SampleCustomer>][])(
    "rejects %s without changing the profile",
    (_reason, overrides) => {
      const customer = makeCustomer(overrides)
      const before = JSON.stringify(customer)

      expect(() => assertSampleCustomer(customer)).toThrow("No customer was changed")
      expect(JSON.stringify(customer)).toBe(before)
    }
  )
})

describe("sample cart ownership and context", () => {
  it("accepts an incomplete owned cart in the intended context", () => {
    expect(() => assertSampleCart(makeCart(), context)).not.toThrow()
  })

  it.each([
    ["a completed cart", { completed_at: "2026-10-23T00:00:00.000Z" }],
    ["another customer", { customer_id: "cus_other" }],
    ["a guest cart", { customer_id: null }],
    ["another region", { region_id: "reg_other" }],
    ["another sales channel", { sales_channel_id: "sc_other" }],
    ["another currency", { currency_code: "usd" }],
    ["an unmarked cart", { metadata: null }],
    ["another fixture marker", { metadata: { erd_fixture: "another-fixture" } }],
  ] satisfies [string, Partial<SampleCart>][])(
    "rejects %s without changing the cart",
    (_reason, overrides) => {
      const cart = makeCart(overrides)
      const before = JSON.stringify(cart)

      expect(() => assertSampleCart(cart, context)).toThrow("No cart was changed")
      expect(JSON.stringify(cart)).toBe(before)
    }
  )
})

describe("sample cart line reconciliation", () => {
  it("adds nothing when both fixture lines already have the requested quantities", () => {
    const current = desired.map((item) => ({ ...item })).reverse()

    expect(getMissingSampleItems(current, desired)).toEqual([])
    expect(current).toEqual([
      { variant_id: "variant_bag", quantity: 1 },
      { variant_id: "variant_shirt", quantity: 2 },
    ])
  })

  it("returns both requested lines for an empty cart", () => {
    expect(getMissingSampleItems([], desired)).toEqual(desired)
  })

  it.each([
    [desired[0], desired[1]],
    [desired[1], desired[0]],
  ])("returns only the absent line when resuming a partial fixture", (existing, missing) => {
    expect(getMissingSampleItems([{ ...existing }], desired)).toEqual([missing])
  })

  it.each([
    ["an altered quantity", [{ variant_id: "variant_shirt", quantity: 3 }]],
    ["duplicate lines", [{ ...desired[0] }, { ...desired[0] }]],
    ["an unrelated variant", [{ variant_id: "variant_other", quantity: 1 }]],
    ["a missing variant", [{ variant_id: null, quantity: 1 }]],
  ] satisfies [string, SampleItem[]][])(
    "rejects %s without changing existing lines",
    (_reason, current) => {
      const before = JSON.stringify(current)

      expect(() => getMissingSampleItems(current, desired)).toThrow("No existing lines were changed")
      expect(JSON.stringify(current)).toBe(before)
      expect(desired).toEqual([
        { variant_id: "variant_shirt", quantity: 2 },
        { variant_id: "variant_bag", quantity: 1 },
      ])
    }
  )
})
