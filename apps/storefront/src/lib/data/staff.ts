"use server"

import { sdk } from "@lib/config"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type StaffOrder = {
  id: string
  display_id: number
  status: string
  items: { id: string; title: string; quantity: number }[]
}

function staffPath(countryCode: string) {
  return `/${/^[a-z]{2}$/.test(countryCode) ? countryCode : "vn"}/staff`
}

export async function staffLogin(countryCode: string, formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")
  let token: string | undefined
  if (
    typeof email === "string" &&
    typeof password === "string" &&
    email.length <= 254 &&
    password.length <= 1024
  ) {
    try {
      const result = await sdk.auth.login("user", "emailpass", { email, password })
      if (typeof result === "string") {
        await sdk.client.fetch("/staff/me", {
          headers: { authorization: `Bearer ${result}` },
          cache: "no-store",
        })
        token = result
      }
    } catch {
      /* Keep authentication and authorization errors indistinguishable. */
    }
  }
  if (!token) redirect(`${staffPath(countryCode)}?error=login`)
  const cookieJar = await cookies()
  cookieJar.set("_daymark_staff_jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  redirect(staffPath(countryCode))
}

export async function staffLogout(countryCode: string) {
  const cookieJar = await cookies()
  cookieJar.delete("_daymark_staff_jwt")
  redirect(staffPath(countryCode))
}

export async function lookupStaffOrder(countryCode: string, formData: FormData) {
  const id = formData.get("order_id")
  if (typeof id !== "string" || !/^order_[a-zA-Z0-9]+$/.test(id)) {
    redirect(`${staffPath(countryCode)}?error=order`)
  }
  redirect(`${staffPath(countryCode)}?order=${encodeURIComponent(id)}`)
}

export async function retrieveStaffOrder(
  orderId?: string,
): Promise<{ signedIn: boolean; order?: StaffOrder; error?: boolean }> {
  const token = (await cookies()).get("_daymark_staff_jwt")?.value
  if (!token) return { signedIn: false }
  const headers = { authorization: `Bearer ${token}` }
  try {
    await sdk.client.fetch("/staff/me", { headers, cache: "no-store" })
  } catch {
    return { signedIn: false }
  }
  if (!orderId) return { signedIn: true }
  if (!/^order_[a-zA-Z0-9]+$/.test(orderId)) return { signedIn: true, error: true }
  try {
    const { order } = await sdk.client.fetch<{ order: StaffOrder }>(`/staff/orders/${orderId}`, {
      headers,
      cache: "no-store",
    })
    return { signedIn: true, order }
  } catch {
    return { signedIn: true, error: true }
  }
}
