import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { assertFullAdminAccess } from "../modules/staff-access/policy"
import { requestObservability } from "../observability"

import { CreateLegacyCart, AddLegacyCartItem } from "./store/cart/validators"
import { LegacyCredentials } from "./store/auth/validators"
import { validateCartItemWorkflow } from "../workflows/delete-legacy-cart-item"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      middlewares: [requestObservability],
    },
    {
      matcher: "/admin*",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
        async (req: AuthenticatedMedusaRequest, _res, next) => {
          if (req.auth_context?.actor_type === "user" && req.auth_context.actor_id) {
            await assertFullAdminAccess(req.scope.resolve(Modules.USER), req.auth_context.actor_id)
          }
          next()
        },
      ],
    },
    {
      matcher: "/store/carts/:id/line-items",
      method: "POST",
      middlewares: [
        (req, _res, next) => {
          const quantity = (req.body as { quantity?: unknown }).quantity
          if (typeof quantity === "number" && !Number.isInteger(quantity)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Cart item quantity must be an integer",
            )
          }
          next()
        },
      ],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      method: "DELETE",
      middlewares: [
        async (req, _res, next) => {
          await validateCartItemWorkflow(req.scope).run({
            input: { cart_id: req.params.id, line_item_id: req.params.line_id },
          })
          next()
        },
      ],
    },
    {
      matcher: "/store/cart",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateLegacyCart)],
    },
    {
      matcher: "/store/cart/:cartId/items",
      method: "POST",
      middlewares: [validateAndTransformBody(AddLegacyCartItem)],
    },
    {
      matcher: "/store/auth/login",
      method: "POST",
      middlewares: [validateAndTransformBody(LegacyCredentials)],
    },
    {
      matcher: "/store/auth/register",
      method: "POST",
      middlewares: [validateAndTransformBody(LegacyCredentials)],
    },
    {
      matcher: "/store/personalization/*",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/recommendations/for-you",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
  ],
})
