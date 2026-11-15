import { createHash } from "node:crypto"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { readFileSync } from "node:fs"
import { validateManifest, verifyAssetFiles } from "../daymark-catalog/manifest"
import type { CatalogImageManifest } from "../daymark-catalog/types"
import { editorialManifest, fixture, manifestWithMapping } from "./daymark-catalog-harness"

const SHIPPED_DATASET_DIR = resolve(__dirname, "../../../assets/daymark-catalog")

function clone(manifest: CatalogImageManifest): CatalogImageManifest {
  return JSON.parse(JSON.stringify(manifest)) as CatalogImageManifest
}

describe("DAYMARK catalog image manifest", () => {
  it("accepts the shipped dataset and matches every image checksum", () => {
    const manifest = JSON.parse(
      readFileSync(join(SHIPPED_DATASET_DIR, "manifest.json"), "utf8"),
    ) as CatalogImageManifest
    expect(validateManifest(manifest, fixture).errors).toEqual([])
    const checks = verifyAssetFiles(SHIPPED_DATASET_DIR, manifest)
    expect(checks).toHaveLength(manifest.assets.length)
    expect(checks.every((check) => check.ok)).toBe(true)
  })

  it("maps one representative image to each catalog product", () => {
    const manifest = JSON.parse(
      readFileSync(join(SHIPPED_DATASET_DIR, "manifest.json"), "utf8"),
    ) as CatalogImageManifest
    const mappings = manifest.assets.flatMap((asset) => asset.productMappings)
    expect(manifest.assets.filter((asset) => asset.role === "editorial")).toHaveLength(4)
    expect(mappings).toHaveLength(fixture.products.length)
    expect(new Set(mappings.map((mapping) => mapping.productHandle)).size).toBe(
      fixture.products.length,
    )
    expect(mappings.every((mapping) => mapping.matchConfidence === "representative")).toBe(true)
  })

  it("rejects malformed checksums, oversized files and unsafe names", () => {
    const manifest = clone(editorialManifest())
    const asset = manifest.assets[0] as unknown as Record<string, unknown>
    asset.sha256 = "not-a-checksum"
    asset.bytes = 5 * 1024 * 1024
    asset.filename = "../escape.jpg"
    const errors = validateManifest(manifest, fixture).errors.join(" ")
    expect(errors).toContain("64 lowercase hexadecimal")
    expect(errors).toContain("per-file cap")
    expect(errors).toContain("flat lowercase image file name")
  })

  it("requires product mappings to reference fixture handles", () => {
    expect(
      validateManifest(manifestWithMapping("dm-not-in-fixture"), fixture).errors.join(" "),
    ).toContain('unknown product handle "dm-not-in-fixture"')
  })

  it("rejects product assets without a mapping and editorial mappings", () => {
    const product = manifestWithMapping("dm-tee-core")
    ;(product.assets[0] as unknown as Record<string, unknown>).productMappings = []
    expect(validateManifest(product, fixture).errors.join(" ")).toContain(
      "must map to at least one product handle",
    )

    const editorial = clone(editorialManifest())
    ;(editorial.assets[0] as unknown as Record<string, unknown>).productMappings = [
      { productHandle: "dm-tee-core", matchConfidence: "representative" },
    ]
    expect(validateManifest(editorial, fixture).errors.join(" ")).toContain(
      "is editorial and must not map to products",
    )
  })

  it("detects tampered or missing image files", () => {
    const dir = mkdtempSync(join(tmpdir(), "daymark-asset-"))
    try {
      const content = Buffer.from("original bytes")
      const sha256 = createHash("sha256").update(content).digest("hex")
      writeFileSync(join(dir, "dm-editorial-900.jpg"), content)
      const manifest = manifestWithMapping("dm-tee-core", { sha256, bytes: content.length })
      expect(verifyAssetFiles(dir, manifest)[0].ok).toBe(true)
      writeFileSync(join(dir, "dm-editorial-900.jpg"), Buffer.from("changed bytes"))
      expect(verifyAssetFiles(dir, manifest)[0].problem).toContain("checksum")
      rmSync(join(dir, "dm-editorial-900.jpg"))
      expect(verifyAssetFiles(dir, manifest)[0].problem).toContain("missing")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
