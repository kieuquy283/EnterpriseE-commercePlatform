"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { customerErrorMessage } from "@lib/util/customer-error-message"
import { HttpTypes } from "@medusajs/types"
import { FetchError } from "@medusajs/js-sdk"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  getPendingCustomer,
  removeAuthToken,
  removeCartId,
  removePendingCustomer,
  setAuthToken,
  setPendingCustomer,
} from "./cookies"

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

// Requests a verification email for the given customer. The request must be
// authenticated with a token tied to the auth identity (the token returned by
// register or by a login that requires verification).
async function requestVerificationEmail(email: string, token: string) {
  await sdk.auth.verification.request(
    {
      entity_id: email,
      entity_type: "email",
    },
    {
      authorization: `Bearer ${token}`,
    },
  )
}

export const retrieveCustomer = async (): Promise<HttpTypes.StoreCustomer | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  return await sdk.client
    .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
      method: "GET",
      query: {
        fields: "*orders",
      },
      headers,
      cache: "no-store",
    })
    .then(({ customer }) => customer)
    .catch(() => null)
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(
  _currentState: unknown,
  formData: FormData,
): Promise<CustomerAuthState> {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email.trim())) {
    return { state: "error", error: "Vui lòng nhập email hợp lệ." }
  }
  if (!customerForm.first_name?.trim() || !customerForm.last_name?.trim()) {
    return { state: "error", error: "Vui lòng nhập họ và tên." }
  }
  if (!/^0\d{9}$/.test(customerForm.phone)) {
    return { state: "error", error: "Số điện thoại cần có 10 chữ số và bắt đầu bằng 0." }
  }
  if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    return { state: "error", error: "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số." }
  }

  try {
    await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password,
    })
  } catch (error) {
    const fetchError = error as FetchError
    // An existing identity (for example, an admin user with the same email) is
    // expected and handled: the customer can still log in to link a customer
    // record. Any other error is surfaced.
    if (
      fetchError.statusText !== "Unauthorized" ||
      fetchError.message !== "Identity with email already exists"
    ) {
      return { state: "error", error: customerErrorMessage(String(error)) }
    }
  }

  // Persist the extra signup fields. The customer record is created during
  // login, which is deferred until after email verification when the backend
  // requires it.
  await setPendingCustomer(customerForm)

  // Continue by logging in. The login response tells us whether the backend
  // requires email verification — we don't need a storefront-side flag.
  return completeLogin(customerForm.email, password)
}

export async function login(
  _currentState: unknown,
  formData: FormData,
): Promise<CustomerAuthState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email?.trim() || !password) {
    return { state: "error", error: "Vui lòng nhập email và mật khẩu." }
  }

  return completeLogin(email, password)
}

// Logs the customer in and reconciles the customer record. The behavior is
// driven entirely by the backend's login response, so it works whether or not
// email verification is enabled.
async function completeLogin(email: string, password: string): Promise<CustomerAuthState> {
  let result: Awaited<ReturnType<typeof sdk.auth.login>>

  try {
    result = await sdk.auth.login("customer", "emailpass", { email, password })
  } catch (error) {
    return { state: "error", error: customerErrorMessage(String(error)) }
  }

  // A `location` is returned by third-party auth providers, which this flow
  // doesn't support.
  if (typeof result === "object" && "location" in result) {
    return {
      state: "error",
      error: "This login method isn't supported by the storefront.",
    }
  }

  // The backend requires email verification and the customer hasn't verified
  // yet. Send the verification email and ask them to check their inbox.
  if (
    typeof result === "object" &&
    "verification_required" in result &&
    result.verification_required
  ) {
    try {
      await requestVerificationEmail(email, result.token)
    } catch {
      // Ignore: the customer can resend from the verification page.
    }
    return { state: "verification_required", email }
  }

  if (typeof result !== "string") {
    return {
      state: "error",
      error: "Authentication requires additional steps that aren't supported.",
    }
  }

  let token = result

  // The token may not be tied to a customer record yet — right after
  // registration, or after verifying a brand-new account. Ask the backend:
  // `/store/customers/me` rejects tokens without a registered actor, so a
  // failed retrieve means we still need to create the customer, then log in
  // again to obtain a customer-bound token.
  const customerExists = await sdk.store.customer
    .retrieve({}, { authorization: `Bearer ${token}` })
    .then(() => true)
    .catch(() => false)

  if (!customerExists) {
    const pending = await getPendingCustomer()
    const signupDetails = pending?.email.toLowerCase() === email.toLowerCase() ? pending : null

    try {
      await sdk.store.customer.create(
        {
          email,
          first_name: signupDetails?.first_name,
          last_name: signupDetails?.last_name,
          phone: signupDetails?.phone,
        },
        {},
        { authorization: `Bearer ${token}` },
      )

      token = (await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      })) as string
    } catch (error) {
      return { state: "error", error: customerErrorMessage(String(error)) }
    }

    await removePendingCustomer()
  }

  await setAuthToken(token)
  revalidatePath("/", "layout")

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  try {
    await transferCart()
  } catch (error) {
    return { state: "error", error: String(error) }
  }

  return { state: "success" }
}

// Confirms a customer's email using the token from the verification link.
//
// The confirm route doesn't require authentication, so this works even when the
// customer opens the link on a different device than the one they signed up on.
export async function confirmEmailVerification(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await sdk.auth.verification.confirm({ code: token })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

function validateAddress(formData: FormData): string | null {
  const field = (name: string) => String(formData.get(name) ?? "").trim()
  if (!field("first_name") || !field("last_name") || !field("address_1") || !field("city")) {
    return "Vui lòng nhập họ tên và địa chỉ giao hàng."
  }
  if (field("country_code").toLowerCase() === "vn") {
    if (!field("address_2")) {
      return "Vui lòng nhập phường hoặc xã."
    }
    if (!/^\d{6}$/.test(field("postal_code"))) {
      return "Mã bưu chính Việt Nam cần đúng 6 chữ số."
    }
    if (!field("province")) {
      return "Vui lòng nhập tỉnh hoặc thành phố."
    }
  }
  if (field("phone") && !/^0\d{9}$/.test(field("phone"))) {
    return "Số điện thoại cần có 10 chữ số và bắt đầu bằng 0."
  }
  return null
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData,
): Promise<{ success: boolean; error: string | null }> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false
  const validationError = validateAddress(formData)
  if (validationError) return { success: false, error: validationError }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      revalidatePath("/", "layout")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: customerErrorMessage(String(err)) }
    })
}

export const deleteCustomerAddress = async (addressId: string): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer.deleteAddress(addressId, headers)
  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)
  revalidatePath("/", "layout")
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData,
): Promise<{ success: boolean; error: string | null }> => {
  const addressId = (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }
  const validationError = validateAddress(formData)
  if (validationError) return { success: false, error: validationError }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      revalidatePath("/", "layout")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: customerErrorMessage(String(err)) }
    })
}

export async function setDefaultShippingAddress(addressId: string) {
  const headers = await getAuthHeaders()
  if (!headers.authorization || !addressId) {
    throw new Error("Vui lòng đăng nhập để chọn địa chỉ mặc định.")
  }
  await sdk.store.customer.updateAddress(addressId, { is_default_shipping: true }, {}, headers)
  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)
  revalidatePath("/", "layout")
}
