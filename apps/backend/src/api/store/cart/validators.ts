import { z } from "@medusajs/framework/zod"

export const CreateLegacyCart = z
  .object({
    region_id: z.string().min(1),
    sales_channel_id: z.string().min(1).optional(),
    email: z.email().optional(),
  })
  .strict()

export const AddLegacyCartItem = z
  .object({
    variant_id: z.string().min(1),
    quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict()

export const GetLegacyCart = z.object({ cart_id: z.string().min(1) }).strict()
