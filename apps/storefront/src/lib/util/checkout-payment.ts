/**
 * Only offer payment providers explicitly supported by this checkout UI.
 * A simulator provider must be registered by Medusa and opted in for demo use.
 *
 * Next.js inlines NEXT_PUBLIC_* values at build time: rebuild the storefront
 * after changing these settings.
 */
export const COD_PAYMENT_PROVIDER_ID = "pp_system_default"

export const SIMULATOR_PAYMENT_PROVIDER_ID =
  process.env.NEXT_PUBLIC_PAYMENT_SIMULATOR_PROVIDER_ID?.trim() || ""

export const SIMULATOR_PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_SIMULATOR_ENABLED === "true" &&
  SIMULATOR_PAYMENT_PROVIDER_ID.startsWith("pp_") &&
  SIMULATOR_PAYMENT_PROVIDER_ID !== COD_PAYMENT_PROVIDER_ID

export const isSimulatorPaymentProvider = (providerId: string) =>
  SIMULATOR_PAYMENT_ENABLED &&
  providerId === SIMULATOR_PAYMENT_PROVIDER_ID

export const isSupportedCheckoutPaymentProvider = (providerId: string) =>
  providerId === COD_PAYMENT_PROVIDER_ID ||
  isSimulatorPaymentProvider(providerId)
