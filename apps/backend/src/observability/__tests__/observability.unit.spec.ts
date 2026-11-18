import { boundedId, logOperation, orderOperationId } from ".."

describe("privacy safe operation logs", () => {
  it.each([undefined, ["one", "two"], "bad\nvalue", "a".repeat(65), "person@example.test", ""])(
    "rejects unsafe identifier %p",
    (value) => {
      expect(boundedId(value)).toBeUndefined()
    },
  )
  it("joins order events without recording the source order identifier", () => {
    expect(orderOperationId("order_fixture")).toBe(orderOperationId("order_fixture"))
    expect(orderOperationId("order_fixture")).not.toBe(orderOperationId("order_other"))
    expect(orderOperationId("order_fixture")).not.toContain("fixture")
  })
  it("projects allowed fields and logs failures at error level", () => {
    const logger = { log: jest.fn() }
    logOperation(logger, {
      event: "order.event.failed",
      operation_id: "operation-1",
      ...{ password: "never-log-me" },
    })
    expect(logger.log.mock.calls[0][0]).toBe("error")
    const text = JSON.stringify(logger.log.mock.calls[0][2])
    expect(JSON.parse(text)).toMatchObject({
      event: "order.event.failed",
      operation_id: "operation-1",
    })
    expect(text).not.toContain("never-log-me")
  })
})
