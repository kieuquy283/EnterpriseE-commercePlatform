import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import type { CatalogFixture, CatalogImageManifest, MatchConfidence } from "./types"

const MAX_ASSET_BYTES = 2 * 1024 * 1024
const MAX_ASSETS = 40
const MAX_TOTAL_BYTES = 60 * 1024 * 1024
const MATCH_CONFIDENCES: MatchConfidence[] = [
  "exact-product",
  "representative",
  "category-representative",
]

export type ManifestValidationResult = {
  ok: boolean
  errors: string[]
}

function isSafeFilename(value: string): boolean {
  return (
    /^[a-z0-9][a-z0-9-]*\.(?:jpg|jpeg|png|webp)$/.test(value) &&
    !value.includes("/") &&
    !value.includes("..")
  )
}

export function validateManifest(
  manifest: CatalogImageManifest,
  fixture: CatalogFixture,
): ManifestValidationResult {
  const errors: string[] = []
  const productHandles = new Set(fixture.products.map((product) => product.handle))

  if (!Number.isInteger(manifest.manifestVersion) || manifest.manifestVersion < 1) {
    errors.push("manifest.manifestVersion must be a positive integer")
  }
  if (!Array.isArray(manifest.assets)) {
    errors.push("manifest.assets must be an array")
    return { ok: false, errors }
  }
  if (manifest.assets.length > MAX_ASSETS) {
    errors.push(`manifest declares ${manifest.assets.length} assets; the cap is ${MAX_ASSETS}`)
  }

  const ids = new Set<string>()
  const filenames = new Set<string>()
  let totalBytes = 0

  for (const asset of manifest.assets) {
    const where = `asset "${asset.id ?? "(missing id)"}"`
    if (typeof asset.id !== "string" || !asset.id.startsWith("dm-")) {
      errors.push(`${where} id must start with the DAYMARK dm- prefix`)
    }
    if (ids.has(asset.id)) errors.push(`duplicate asset id "${asset.id}"`)
    ids.add(asset.id)
    if (!isSafeFilename(asset.filename ?? "")) {
      errors.push(`${where} filename "${asset.filename}" must be a flat lowercase image file name`)
    }
    if (filenames.has(asset.filename)) errors.push(`duplicate asset filename "${asset.filename}"`)
    filenames.add(asset.filename)
    if (asset.role !== "product" && asset.role !== "editorial") {
      errors.push(`${where} role must be "product" or "editorial"`)
    }
    if (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      errors.push(`${where} sha256 must be 64 lowercase hexadecimal characters`)
    }
    if (!Number.isInteger(asset.bytes) || asset.bytes <= 0) {
      errors.push(`${where} bytes must be a positive integer`)
    } else {
      totalBytes += asset.bytes
      if (asset.bytes > MAX_ASSET_BYTES) {
        errors.push(`${where} is ${asset.bytes} bytes; the per-file cap is ${MAX_ASSET_BYTES}`)
      }
    }
    for (const dimension of ["width", "height"] as const) {
      if (!Number.isInteger(asset[dimension]) || asset[dimension] <= 0) {
        errors.push(`${where} ${dimension} must be a positive integer`)
      }
    }
    if (
      asset.mimeType !== "image/jpeg" &&
      asset.mimeType !== "image/png" &&
      asset.mimeType !== "image/webp"
    ) {
      errors.push(`${where} mimeType must be JPEG, PNG or WebP`)
    }
    if (!Array.isArray(asset.productMappings)) {
      errors.push(`${where} productMappings must be an array`)
      continue
    }
    if (asset.role === "editorial" && asset.productMappings.length > 0) {
      errors.push(`${where} is editorial and must not map to products`)
    }
    if (asset.role === "product" && asset.productMappings.length === 0) {
      errors.push(`${where} is a product asset and must map to at least one product handle`)
    }
    const mappedHandles = new Set<string>()
    for (const mapping of asset.productMappings) {
      if (!productHandles.has(mapping.productHandle)) {
        errors.push(`${where} maps to unknown product handle "${mapping.productHandle}"`)
      }
      if (mappedHandles.has(mapping.productHandle)) {
        errors.push(`${where} maps to "${mapping.productHandle}" more than once`)
      }
      mappedHandles.add(mapping.productHandle)
      if (!MATCH_CONFIDENCES.includes(mapping.matchConfidence)) {
        errors.push(
          `${where} matchConfidence "${mapping.matchConfidence}" must be one of ${MATCH_CONFIDENCES.join(", ")}`,
        )
      }
    }
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    errors.push(`manifest assets total ${totalBytes} bytes; the cap is ${MAX_TOTAL_BYTES}`)
  }
  return { ok: errors.length === 0, errors }
}

export function manifestAssetPath(assetDir: string, filename: string): string {
  return join(assetDir, filename)
}

export type AssetFileCheck = {
  filename: string
  ok: boolean
  problem: string | null
  sha256: string | null
  bytes: number | null
}

export function verifyAssetFiles(
  assetDir: string,
  manifest: CatalogImageManifest,
): AssetFileCheck[] {
  return manifest.assets.map((asset) => {
    const path = manifestAssetPath(assetDir, asset.filename)
    if (!existsSync(path)) {
      return {
        filename: asset.filename,
        ok: false,
        problem: "file is missing from the dataset directory",
        sha256: null,
        bytes: null,
      }
    }
    const bytes = statSync(path).size
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex")
    const matches = bytes === asset.bytes && sha256 === asset.sha256
    return {
      filename: asset.filename,
      ok: matches,
      problem: matches ? null : "file byte size or checksum does not match the manifest",
      sha256,
      bytes,
    }
  })
}
