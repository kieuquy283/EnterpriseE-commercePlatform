import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"

import { CreateLegacyCart, AddLegacyCartItem } from "./store/cart/validators"
import { LegacyCredentials } from "./store/auth/validators"
import { validateCartItemWorkflow } from "../workflows/delete-legacy-cart-item"

export default defineMiddlewares({
  routes: [
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
