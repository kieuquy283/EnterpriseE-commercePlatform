import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [{
    matcher: "/store/personalization/*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  }, {
    matcher: "/store/recommendations/for-you",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  }],
})
