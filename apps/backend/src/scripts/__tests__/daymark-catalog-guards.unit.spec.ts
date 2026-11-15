import {
  ALLOW_REMOTE_FLAG,
  assertImportGuard,
  CatalogImportRefused,
  parseImageMode,
  redactDatabaseHost,
  WRITE_FLAG,
  ENVIRONMENT_FLAG,
  assertLocalImagePreviewGuard,
} from "../daymark-catalog/guards"

const LOCAL_URL = "postgresql://daymark:secret@127.0.0.1:5432/daymark_local"
const REMOTE_URL = "postgresql://daymark:secret@db.internal.example:5432/daymark"

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "development",
    DATABASE_URL: LOCAL_URL,
    [WRITE_FLAG]: "1",
    [ENVIRONMENT_FLAG]: "local-disposable",
    ...overrides,
  }
}

describe("DAYMARK catalog import environment guard", () => {
  it("defaults to a dry run with no flags", () => {
    const result = assertImportGuard({ argv: [], env: baseEnv() })
    expect(result.mode).toBe("dry-run")
    expect(result.databaseHost).toBe("127.0.0.1:5432")
    expect(result.databaseIsLocal).toBe(true)
  })

  it("refuses production", () => {
    expect(() =>
      assertImportGuard({ argv: ["--apply"], env: baseEnv({ NODE_ENV: "production" }) }),
    ).toThrow(CatalogImportRefused)
    expect(() => assertImportGuard({ argv: [], env: baseEnv({ NODE_ENV: "production" }) })).toThrow(
      /NODE_ENV=production/,
    )
  })

  it("refuses a non-local database host", () => {
    expect(() =>
      assertImportGuard({ argv: ["--dry-run"], env: baseEnv({ DATABASE_URL: REMOTE_URL }) }),
    ).toThrow(/non-local database host/)
  })

  it("refuses remote hosts even with the legacy override", () => {
    expect(() =>
      assertImportGuard({
        argv: [],
        env: baseEnv({
          DATABASE_URL: REMOTE_URL,
          [ALLOW_REMOTE_FLAG]: "1",
        }),
      }),
    ).toThrow(/non-local/)
  })

  it("refuses apply without the explicit write flag", () => {
    expect(() =>
      assertImportGuard({
        argv: ["--apply"],
        env: baseEnv({ [WRITE_FLAG]: undefined }),
      }),
    ).toThrow(/DAYMARK_CATALOG_WRITE=1/)
  })

  it("refuses apply without the disposable-environment opt-in", () => {
    expect(() =>
      assertImportGuard({
        argv: ["--apply"],
        env: baseEnv({ [ENVIRONMENT_FLAG]: undefined }),
      }),
    ).toThrow(/must be set to "local-disposable"/)
  })

  it("refuses an unknown environment value and lists the accepted values", () => {
    expect(() =>
      assertImportGuard({ argv: [], env: baseEnv({ [ENVIRONMENT_FLAG]: "staging" }) }),
    ).toThrow(/Accepted values: local-disposable/)
  })

  it("refuses an unknown flag and lists the accepted modes", () => {
    expect(() => assertImportGuard({ argv: ["--force"], env: baseEnv() })).toThrow(
      /Unknown flag "--force"/,
    )
    expect(() => assertImportGuard({ argv: ["--force"], env: baseEnv() })).toThrow(
      /--dry-run, --apply/,
    )
  })

  it("refuses conflicting mode flags", () => {
    expect(() => assertImportGuard({ argv: ["--apply", "--dry-run"], env: baseEnv() })).toThrow(
      /not both/,
    )
  })

  it("refuses a missing database URL without printing any value", () => {
    expect(() =>
      assertImportGuard({ argv: [], env: baseEnv({ DATABASE_URL: undefined }) }),
    ).toThrow(/DATABASE_URL is not set/)

    let message = ""
    try {
      assertImportGuard({ argv: [], env: baseEnv({ DATABASE_URL: "not a url" }) })
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain("could not be parsed")
    expect(message).not.toContain("not a url")
  })

  it("never returns credentials", () => {
    const result = assertImportGuard({ argv: ["--apply"], env: baseEnv() })
    const serialised = JSON.stringify(result)
    expect(serialised).not.toContain("secret")
    expect(serialised).not.toContain("postgresql://")
    expect(redactDatabaseHost(LOCAL_URL)).toBe("127.0.0.1:5432")
  })

  it("warns in dry-run that apply would be refused", () => {
    const result = assertImportGuard({
      argv: ["--dry-run"],
      env: baseEnv({ [WRITE_FLAG]: undefined, [ENVIRONMENT_FLAG]: undefined }),
    })
    expect(result.mode).toBe("dry-run")
    expect(result.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it("parses the image mode", () => {
    expect(parseImageMode([])).toBe("none")
    expect(parseImageMode(["--images", "manifest"])).toBe("manifest")
    expect(parseImageMode(["--images", "demo"])).toBe("demo")
    expect(parseImageMode(["--images=none"])).toBe("none")
    expect(() => parseImageMode(["--images", "remote"])).toThrow(
      /Accepted values: none, manifest, demo/,
    )
  })

  it("allows demo media only for an explicit loopback test backend without S3", () => {
    expect(
      assertLocalImagePreviewGuard({
        NODE_ENV: "test",
        DAYMARK_LOCAL_IMAGE_BACKEND_URL: "http://127.0.0.1:19000",
      }),
    ).toBe("http://127.0.0.1:19000")
    expect(() =>
      assertLocalImagePreviewGuard({
        NODE_ENV: "development",
        DAYMARK_LOCAL_IMAGE_BACKEND_URL: "http://127.0.0.1:19000",
      }),
    ).toThrow(/NODE_ENV=test/)
    expect(() =>
      assertLocalImagePreviewGuard({
        NODE_ENV: "test",
        DAYMARK_LOCAL_IMAGE_BACKEND_URL: "https://cdn.example.test",
      }),
    ).toThrow(/loopback/)
  })
})

describe("DAYMARK malformed invocation refusal", () => {
  it.each([
    ["--apply", "--apply"],
    ["--apply=false"],
    ["--images"],
    ["--images=none", "--images=manifest"],
  ])("rejects ambiguous arguments %j", (...argv) => {
    expect(() => {
      assertImportGuard({ argv, env: baseEnv() })
      parseImageMode(argv)
    }).toThrow(CatalogImportRefused)
  })
  it.each(["https://localhost/database", "postgresql://localhost/"])(
    "rejects non-database URLs",
    (url) => {
      expect(() => assertImportGuard({ argv: [], env: baseEnv({ DATABASE_URL: url }) })).toThrow()
    },
  )
  it("accepts loopback IPv6", () => {
    expect(
      assertImportGuard({
        argv: [],
        env: baseEnv({ DATABASE_URL: "postgresql://[::1]/daymark_local" }),
      }).databaseIsLocal,
    ).toBe(true)
  })
})
