import { coalesceAnonymous } from "../coalesce"

describe("anonymous validation coalescing", () => {
  it("shares concurrent work and never caches completed results", async () => {
    let finish!: (value: number) => void
    const work = jest.fn(() => new Promise<number>((resolve) => { finish = resolve }))
    const context = { headers: { "x-publishable-api-key": "test-key" } }
    const first = coalesceAnonymous(context, { region: "a" }, work)
    const second = coalesceAnonymous(context, { region: "a" }, work)
    expect(work).toHaveBeenCalledTimes(1)
    finish(1)
    expect(await Promise.all([first, second])).toEqual([1, 1])
    expect(await coalesceAnonymous(context, { region: "a" }, async () => 2)).toBe(2)
  })

  it("isolates region/channel and authenticated contexts", async () => {
    const work = jest.fn(async () => 1)
    await Promise.all([
      coalesceAnonymous({ headers: { "x-publishable-api-key": "one" } }, { region: "a" }, work),
      coalesceAnonymous({ headers: { "x-publishable-api-key": "two" } }, { region: "a" }, work),
      coalesceAnonymous({ headers: { "x-publishable-api-key": "one" } }, { region: "b" }, work),
      coalesceAnonymous({ headers: { authorization: "fixture" } }, { region: "a" }, work),
      coalesceAnonymous({ headers: { authorization: "fixture" } }, { region: "a" }, work),
    ])
    expect(work).toHaveBeenCalledTimes(5)
  })

  it("evicts failures so later requests can retry", async () => {
    const context = { headers: {} }
    await expect(coalesceAnonymous(context, {}, async () => { throw new Error("fixture") })).rejects.toThrow("fixture")
    expect(await coalesceAnonymous(context, {}, async () => "recovered")).toBe("recovered")
  })
})
