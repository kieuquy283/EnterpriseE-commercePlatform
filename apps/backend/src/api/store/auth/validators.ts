import { z } from "@medusajs/framework/zod"

export const LegacyCredentials = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .strict()
