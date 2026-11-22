import { isPublishableOrderEvent } from "../../../subscribers/customer-notifications"

describe("customer notification event policy", () => {
  it("drops an order.placed event that arrives after cancellation", () => {
    expect(isPublishableOrderEvent("order.placed", {
      status: "canceled",
      canceled_at: new Date("2026-11-22T10:00:00Z"),
    })).toBe(false)
  })

  it("allows cancellation only after the order is canceled", () => {
    expect(isPublishableOrderEvent("order.canceled", {
      status: "pending",
      canceled_at: null,
    })).toBe(false)
    expect(isPublishableOrderEvent("order.canceled", {
      status: "canceled",
      canceled_at: new Date("2026-11-22T10:00:00Z"),
    })).toBe(true)
  })

  it("allows a placed event that is not stale", () => {
    expect(isPublishableOrderEvent("order.placed", {
      status: "pending",
      canceled_at: null,
    })).toBe(true)
  })
})
