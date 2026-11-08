import { nextConsent } from "../consent-state"

describe("recommendation consent epochs", () => {
  it("defaults to denied and only starts a fresh epoch on a new grant", () => {
    const denied = nextConsent(null, false, "v1")
    expect(denied).toEqual({ granted: false, epoch: 0, terms_version: null })
    const granted = nextConsent(denied, true, "v1")
    expect(granted).toEqual({ granted: true, epoch: 1, terms_version: "v1" })
    expect(nextConsent(granted, true, "v1")).toEqual(granted)
    const withdrawn = nextConsent(granted, false, "v1")
    expect(withdrawn).toEqual({ granted: false, epoch: 2, terms_version: "v1" })
    expect(nextConsent(withdrawn, true, "v1")).toEqual({ granted: true, epoch: 3, terms_version: "v1" })
  })

  it("rejects unbounded or unsafe terms versions", () => {
    expect(() => nextConsent(null, true, "v1 space")).toThrow()
    expect(() => nextConsent(null, true, "x".repeat(41))).toThrow()
  })
})
