/** Raised when a validated plan cannot be applied safely. */
export class ImportApplicationError extends Error {
  readonly code = "DAYMARK_CATALOG_APPLY_FAILED"
  constructor(message: string) {
    super(message)
    this.name = "ImportApplicationError"
  }
}
