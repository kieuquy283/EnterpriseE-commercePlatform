import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { verifyAssetFiles, validateManifest, manifestAssetPath } from "./manifest"
import type { CatalogFixture, CatalogImageManifest } from "./types"

// Locates the local DAYMARK dataset (assets + manifest) and checks it before
// any database work happens.

export const DEFAULT_ASSET_DIR = "assets/daymark-catalog"
export const ASSET_DIR_ENV = "DAYMARK_CATALOG_ASSET_DIR"

export type LoadedDataset = {
  assetDir: string
  manifestPath: string
  manifest: CatalogImageManifest | null
  errors: string[]
  warnings: string[]
}

export function resolveAssetDir(cwd: string, env: Record<string, string | undefined>): string {
  const configured = env[ASSET_DIR_ENV]
  return resolve(cwd, configured && configured.trim() ? configured : DEFAULT_ASSET_DIR)
}

export function loadCatalogDataset(input: {
  assetDir: string
  fixture: CatalogFixture
}): LoadedDataset {
  const manifestPath = resolve(input.assetDir, "manifest.json")
  const errors: string[] = []
  const warnings: string[] = []

  if (!existsSync(manifestPath)) {
    warnings.push(`No image manifest at ${manifestPath}; products are imported without images.`)
    return { assetDir: input.assetDir, manifestPath, manifest: null, errors, warnings }
  }

  let manifest: CatalogImageManifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as CatalogImageManifest
  } catch {
    errors.push(`Image manifest at ${manifestPath} is not valid JSON`)
    return { assetDir: input.assetDir, manifestPath, manifest: null, errors, warnings }
  }

  const validation = validateManifest(manifest, input.fixture)
  errors.push(...validation.errors)
  if (!validation.ok) {
    return { assetDir: input.assetDir, manifestPath, manifest: null, errors, warnings }
  }

  const fileChecks = verifyAssetFiles(input.assetDir, manifest)
  for (const check of fileChecks) {
    if (!check.ok) {
      errors.push(`Asset "${check.filename}": ${check.problem}`)
    }
  }

  const editorial = manifest.assets.filter((asset) => asset.role === "editorial").length
  const mapped = manifest.assets.filter((asset) => asset.productMappings.length > 0).length
  if (manifest.assets.length) {
    warnings.push(
      `Dataset media: ${manifest.assets.length} asset(s), ${editorial} editorial-only, ${mapped} mapped to products.`,
    )
  }

  return { assetDir: input.assetDir, manifestPath, manifest, errors, warnings }
}

export function readAssetBytes(assetDir: string, filename: string): Buffer {
  return readFileSync(manifestAssetPath(assetDir, filename))
}
