import { ImportApplicationError } from "./errors"

/** The configured S3 provider already prefixes keys and targets the existing image proxy. */
export function catalogMediaUrl(
  providerUrl: string,
  env: Record<string, string | undefined>,
): string {
  const url = new URL(providerUrl)
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new ImportApplicationError("File provider returned an invalid public media URL")
  }
  if (env.S3_PUBLIC_IMAGE_PROXY === "true") {
    const configured = env.S3_FILE_URL
    if (!configured)
      throw new ImportApplicationError("S3_FILE_URL must point to the public-image proxy")
    const base = new URL(configured)
    const prefix = `${base.pathname.replace(/\/$/, "")}/public-images/`
    if (
      !base.pathname.replace(/\/$/, "").endsWith("/product-images") ||
      url.origin !== base.origin ||
      !url.pathname.startsWith(prefix) ||
      url.pathname.slice(prefix.length).includes("/") ||
      url.search ||
      url.hash
    ) {
      throw new ImportApplicationError(
        "File provider URL must use /product-images/public-images/<key>; direct bucket URLs are refused",
      )
    }
  }
  if (env.DAYMARK_LOCAL_IMAGE_BACKEND_URL) {
    const localBase = new URL(env.DAYMARK_LOCAL_IMAGE_BACKEND_URL)
    const localPrefix = `${localBase.pathname.replace(/\/$/, "")}/static/`
    if (
      url.origin !== localBase.origin ||
      !url.pathname.startsWith(localPrefix) ||
      url.pathname.slice(localPrefix.length).includes("/") ||
      url.search ||
      url.hash
    ) {
      throw new ImportApplicationError(
        "Local preview media must use the configured loopback file provider",
      )
    }
  }
  return url.href
}
