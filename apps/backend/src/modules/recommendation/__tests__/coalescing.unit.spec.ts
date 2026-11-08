import { clearAnonymousCache, coalesceAnonymous } from "../coalesce"

describe("anonymous validation coalescing", () => {
  beforeEach(() => {
    clearAnonymousCache()
    delete process.env.RECOMMENDATION_CACHE_TTL_MS
    delete process.env.ENABLE_RECOMMENDATION_CACHE
  })

  it("shares concurrent work and never caches completed results when TTL is 0", async () => {
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

  it("caches completed results when TTL > 0 and clears cache on demand", async () => {
    process.env.RECOMMENDATION_CACHE_TTL_MS = "10000"
    const work = jest.fn(async () => 42)
    const context = { headers: { "x-publishable-api-key": "test-key" } }

    const first = await coalesceAnonymous(context, { region: "cached" }, work)
    const second = await coalesceAnonymous(context, { region: "cached" }, work)
    expect(first).toBe(42)
    expect(second).toBe(42)
    expect(work).toHaveBeenCalledTimes(1)

    clearAnonymousCache()
    const third = await coalesceAnonymous(context, { region: "cached" }, work)
    expect(third).toBe(42)
    expect(work).toHaveBeenCalledTimes(2)
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
