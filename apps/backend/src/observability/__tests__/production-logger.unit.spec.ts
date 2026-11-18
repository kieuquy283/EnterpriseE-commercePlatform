import { spawnSync } from "node:child_process"

describe("actual Medusa production logger transport", () => {
  it("emits top-level JSON fields usable by CloudWatch filters", () => {
    const result = spawnSync(
      process.execPath,
      [
        "-r",
        "ts-node/register/transpile-only",
        "-e",
        `
      const { logger } = require("@medusajs/framework/logger")
      const { logOperation } = require("./src/observability")
      logOperation(logger, { event: "http.completed", operation_id: "production-fixture", request_id: "request-fixture", status_code: 503, duration_ms: 12.5 })
    `,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          NODE_ENV: "production",
          LOG_FILE: "",
          LOG_LEVEL: "info",
          RELEASE_SHA: "fixture-sha",
          TS_NODE_COMPILER_OPTIONS: JSON.stringify({
            module: "commonjs",
            moduleResolution: "node",
          }),
        },
      },
    )
    expect(result.status).toBe(0)
    const entries = result.stdout
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      level: "error",
      message: "http.completed",
      event: "http.completed",
      operation_id: "production-fixture",
      status_code: 503,
      duration_ms: 12.5,
      release_sha: "fixture-sha",
    })
    expect(typeof entries[0].duration_ms).toBe("number")
  })
})
