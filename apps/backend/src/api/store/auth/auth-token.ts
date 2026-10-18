import type { AuthIdentityDTO, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateJwtTokenForAuthIdentity } from "@medusajs/medusa/api/auth/utils/generate-jwt-token"

export async function createCustomerToken(
  scope: MedusaContainer,
  authIdentity: AuthIdentityDTO
) {
  const config = scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig

  return generateJwtTokenForAuthIdentity(
    {
      authIdentity,
      actorType: "customer",
      authProvider: "emailpass",
      container: scope,
    },
    {
      secret: http.jwtSecret!,
      expiresIn: http.jwtExpiresIn,
      options: http.jwtOptions,
    }
  )
}
