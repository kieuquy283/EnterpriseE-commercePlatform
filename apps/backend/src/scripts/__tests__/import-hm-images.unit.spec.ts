import { requirePrivateTestTarget } from "../import-hm-images"

describe("H&M media import safety gate", () => {
  const original = { ...process.env }

  afterEach(() => {
    for (const key of ["NODE_ENV", "DATABASE_URL", "HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE", "HM_IMAGE_TEST_BACKEND_URL", "S3_BUCKET", "S3_FILE_URL"] as const) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  })

  it("rejects commerce and production databases", () => {
    process.env.NODE_ENV = "test"
    process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE = "1"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/commerce"
    expect(() => requirePrivateTestTarget()).toThrow("restricted")
    process.env.NODE_ENV = "production"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/recommendation_test"
    expect(() => requirePrivateTestTarget()).toThrow("requires NODE_ENV=test")
  })

  it("requires explicit write flag", () => {
    process.env.NODE_ENV = "test"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/recommendation_test"
    delete process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE
    expect(() => requirePrivateTestTarget()).toThrow("explicit local write flag")
  })

  it("accepts only an explicitly enabled test database", () => {
    process.env.NODE_ENV = "test"
    process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE = "1"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/hm_images_test"
    process.env.HM_IMAGE_TEST_BACKEND_URL = "http://127.0.0.1:9002"
    expect(() => requirePrivateTestTarget()).not.toThrow()
  })

  it("rejects a non-local media origin", () => {
    process.env.NODE_ENV = "test"
    process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE = "1"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/hm_images_test"
    process.env.HM_IMAGE_TEST_BACKEND_URL = "https://example.com"
    expect(() => requirePrivateTestTarget()).toThrow("loopback-only")
  })

  it("rejects configured cloud storage", () => {
    process.env.NODE_ENV = "test"
    process.env.HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE = "1"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/hm_images_test"
    process.env.HM_IMAGE_TEST_BACKEND_URL = "http://127.0.0.1:9002"
    process.env.S3_BUCKET = "external-storage"
    expect(() => requirePrivateTestTarget()).toThrow("cannot use cloud file storage")
  })
})
