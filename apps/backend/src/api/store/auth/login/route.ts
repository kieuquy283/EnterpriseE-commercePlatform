import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createCustomerToken } from "../auth-token"

type Credentials = {
  email?: string
  password?: string
}

export async function POST(
  req: MedusaRequest<Credentials>,
  res: MedusaResponse
) {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" })
    return
  }

  const authModuleService = req.scope.resolve(Modules.AUTH)
  const { success, error, authIdentity } = await authModuleService.authenticate("emailpass", {
    url: req.url,
    headers: req.headers as Record<string, string>,
    query: req.query as Record<string, string>,
    protocol: req.protocol,
    body: { email, password },
  })

  if (!success || !authIdentity) {
    res.status(401).json({ message: error || "Authentication failed" })
    return
  }

  const token = await createCustomerToken(req.scope, authIdentity)
  res.json({ token })
}
