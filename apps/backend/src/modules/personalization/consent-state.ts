export type ConsentState = {
  granted: boolean
  epoch: number
  terms_version: string | null
}

// A new grant starts a new epoch so old events cannot reactivate a withdrawn profile.
export function nextConsent(current: ConsentState | null, granted: boolean, termsVersion: string): ConsentState {
  if (!/^[a-zA-Z0-9._-]{1,40}$/.test(termsVersion)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid consent terms version")
  if (!current) return { granted, epoch: granted ? 1 : 0, terms_version: granted ? termsVersion : null }
  if (granted && (!current.granted || current.terms_version !== termsVersion)) {
    return { granted: true, epoch: current.epoch + 1, terms_version: termsVersion }
  }
  if (!granted && current.granted) {
    return { granted: false, epoch: current.epoch + 1, terms_version: current.terms_version }
  }
  return current
}
import { MedusaError } from "@medusajs/framework/utils"
