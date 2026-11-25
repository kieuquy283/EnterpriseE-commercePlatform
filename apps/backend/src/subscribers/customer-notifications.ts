import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { enqueueNotificationWorkflow } from "../workflows/notification/enqueue-notification"

type OrderSignal = { id: string }

export function isPublishableOrderEvent(
  eventName: "order.placed" | "order.canceled",
  order: { status?: string | null; canceled_at?: Date | string | null },
) {
  if (eventName === "order.placed") {
    return order.status !== "canceled" && !order.canceled_at
  }
  return order.status === "canceled" || Boolean(order.canceled_at)
}

export default async function customerNotifications(
  { event, container }: SubscriberArgs<OrderSignal>,
) {
  if (event.name !== "order.placed" && event.name !== "order.canceled") return

  const order = await container.resolve(Modules.ORDER).retrieveOrder(
    event.data.id,
    { relations: ["customer"] },
  )
  if (!order) return

  if (!isPublishableOrderEvent(
    event.name as "order.placed" | "order.canceled",
    order,
  )) return

  const notificationType =
    event.name === "order.placed" ? "order_placed" : "order_canceled"
  const sourceStateVersion =
    event.name === "order.placed" ? 1 : 2
  const recipient =
    typeof order.email === "string" && order.email
      ? order.email
      : ""

  await enqueueNotificationWorkflow(container).run({
    input: {
      orderId: order.id,
      sourceEventId: `${event.name}:${event.data.id}`,
      sourceStateVersion,
      notificationType,
      recipient,
    },
  })
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled"],
}
