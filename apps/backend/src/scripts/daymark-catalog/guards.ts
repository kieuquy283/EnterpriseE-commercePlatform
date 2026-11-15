// Safety gate for the DAYMARK catalog importer. Every rule here is pure and
// takes an explicit env record so the guard can be unit tested without a
// process environment or a database.

export type CatalogImportMode = "dry-run" | "apply"
export type CatalogEnvironment = "local-disposable"

export const ACCEPTED_MODES: CatalogImportMode[] = ["dry-run", "apply"]
export const ACCEPTED_ENVIRONMENTS: CatalogEnvironment[] = ["local-disposable"]
export const WRITE_FLAG_VALUE = "1"
export const LOCAL_DATABASE_HOSTS = ["localhost", "127.0.0.1", "[::1]"]
export const ALLOW_REMOTE_FLAG = "DAYMARK_CATALOG_ALLOW_REMOTE"
export const WRITE_FLAG = "DAYMARK_CATALOG_WRITE"
export const ENVIRONMENT_FLAG = "DAYMARK_CATALOG_ENVIRONMENT"

export class CatalogImportRefused extends Error {
  readonly code = "DAYMARK_CATALOG_REFUSED"
  constructor(message: string) {
    super(message)
    this.name = "CatalogImportRefused"
  }
}

export type GuardInput = {
  argv: readonly string[]
  env: Record<string, string | undefined>
}

export type GuardResult = {
  mode: CatalogImportMode
  environment: CatalogEnvironment
  /** Redacted database host only. Credentials and the full URL are never returned. */
  databaseHost: string
  databaseIsLocal: boolean
  remoteOverride: boolean
  warnings: string[]
}

function parseMode(argv: readonly string[]): CatalogImportMode {
  const flags = argv.filter((argument) => argument.startsWith("--"))
  const accepted = ACCEPTED_MODES.map((mode) => `--${mode}`).join(", ")
  const wanted = new Set<string>()
  for (const flag of flags) {
    const name = flag.split("=")[0]
    if (name === "--apply" || name === "--dry-run") {
      if (flag !== name || wanted.has(name)) {
        throw new CatalogImportRefused("Mode flags must appear once without a value")
      }
      wanted.add(name)
      continue
    }
    if (name === "--images" || name === "--help") {
      continue
    }
    throw new CatalogImportRefused(
      `Unknown flag "${flag}". Accepted flags: ${accepted}, --images, --help`,
    )
  }
  if (wanted.size > 1) {
    throw new CatalogImportRefused(
      "Pass either --dry-run or --apply, not both. Accepted flags: " + accepted,
    )
  }
  if (wanted.has("--apply")) {
    return "apply"
  }
  if (wanted.has("--dry-run")) {
    return "dry-run"
  }
  return "dry-run"
}

export function parseImageMode(argv: readonly string[]): "none" | "manifest" | "demo" {
  let value: string | undefined
  let seen = false
  for (const [index, argument] of argv.entries()) {
    if (argument === "--images" || argument.startsWith("--images=")) {
      if (seen) throw new CatalogImportRefused("Pass --images only once")
      seen = true
    }
    if (argument === "--images") {
      if (!argv[index + 1] || argv[index + 1].startsWith("--")) {
        throw new CatalogImportRefused("--images requires none, manifest or demo")
      }
      value = argv[index + 1]
    } else if (argument.startsWith("--images=")) {
      value = argument.split("=")[1]
    }
  }
  if (value === undefined) {
    return "none"
  }
  if (value !== "none" && value !== "manifest" && value !== "demo") {
    throw new CatalogImportRefused(
      `Unknown --images value "${value}". Accepted values: none, manifest, demo`,
    )
  }
  return value
}

export const LOCAL_MEDIA_URL_FLAG = "DAYMARK_LOCAL_IMAGE_BACKEND_URL"

export function assertLocalImagePreviewGuard(env: Record<string, string | undefined>): string {
  const value = env[LOCAL_MEDIA_URL_FLAG]
  if (!value) {
    throw new CatalogImportRefused(
      `${LOCAL_MEDIA_URL_FLAG} must be an explicit loopback http URL for local demo images`,
    )
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new CatalogImportRefused(
      `${LOCAL_MEDIA_URL_FLAG} must be an explicit loopback http URL for local demo images`,
    )
  }
  if (
    env.NODE_ENV !== "test" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    env.S3_BUCKET ||
    env.S3_FILE_URL
  ) {
    throw new CatalogImportRefused(
      `--images demo requires NODE_ENV=test, a loopback-only ${LOCAL_MEDIA_URL_FLAG}, and no S3 provider configuration`,
    )
  }
  return url.origin
}

export function redactDatabaseHost(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.pathname.slice(1)) {
    throw new CatalogImportRefused("Expected a PostgreSQL database URL")
  }
  const port = url.port ? `:${url.port}` : ""
  return `${url.hostname}${port}`
}

export function assertImportGuard(input: GuardInput): GuardResult {
  const mode = parseMode(input.argv)
  const warnings: string[] = []

  if (input.env.NODE_ENV === "production") {
    throw new CatalogImportRefused(
      "Refusing to run the DAYMARK catalog importer with NODE_ENV=production",
    )
  }

  const rawEnvironment = input.env[ENVIRONMENT_FLAG]
  if (
    rawEnvironment !== undefined &&
    !ACCEPTED_ENVIRONMENTS.includes(rawEnvironment as CatalogEnvironment)
  ) {
    throw new CatalogImportRefused(
      `Unknown ${ENVIRONMENT_FLAG} value "${rawEnvironment}". Accepted values: ${ACCEPTED_ENVIRONMENTS.join(", ")}`,
    )
  }

  const databaseUrl = input.env.DATABASE_URL
  if (!databaseUrl) {
    throw new CatalogImportRefused(
      "DATABASE_URL is not set. The importer needs a local disposable database to read current catalog state.",
    )
  }

  let databaseHost: string
  try {
    databaseHost = redactDatabaseHost(databaseUrl)
  } catch {
    throw new CatalogImportRefused(
      "DATABASE_URL could not be parsed as a connection URL. Its value is not printed.",
    )
  }

  const hostname = new URL(databaseUrl).hostname
  const databaseIsLocal = LOCAL_DATABASE_HOSTS.includes(hostname)
  const remoteOverride = false

  if (!databaseIsLocal && !remoteOverride) {
    throw new CatalogImportRefused(
      `Refusing to run against a non-local database host (${databaseHost}). Allowed hosts: ${LOCAL_DATABASE_HOSTS.join(
        ", ",
      )}. Remote overrides are not supported.`,
    )
  }

  if (mode === "apply") {
    if (input.env[WRITE_FLAG] !== WRITE_FLAG_VALUE) {
      throw new CatalogImportRefused(
        `Refusing to write: set ${WRITE_FLAG}=${WRITE_FLAG_VALUE} to apply changes. Run without --apply for a dry run.`,
      )
    }
    if (rawEnvironment !== "local-disposable") {
      throw new CatalogImportRefused(
        `Refusing to write: ${ENVIRONMENT_FLAG} must be set to "local-disposable". Accepted values: ${ACCEPTED_ENVIRONMENTS.join(
          ", ",
        )}`,
      )
    }
  } else {
    if (rawEnvironment === undefined) {
      warnings.push(
        `${ENVIRONMENT_FLAG} is not set, so --apply would be refused. This run is a dry run and writes nothing.`,
      )
    }
    if (input.env[WRITE_FLAG] !== WRITE_FLAG_VALUE) {
      warnings.push(`${WRITE_FLAG} is not set to ${WRITE_FLAG_VALUE}, so --apply would be refused.`)
    }
  }

  return {
    mode,
    environment: (rawEnvironment as CatalogEnvironment | undefined) ?? "local-disposable",
    databaseHost,
    databaseIsLocal,
    remoteOverride,
    warnings,
  }
}
