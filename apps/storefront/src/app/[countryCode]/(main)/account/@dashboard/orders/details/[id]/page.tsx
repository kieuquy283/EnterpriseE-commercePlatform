import { retrieveOrder } from "@lib/data/orders"
import { retrieveCustomer } from "@lib/data/customer"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const customer = await retrieveCustomer()
  if (!customer) notFound()
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order || order.customer_id !== customer.id) {
    notFound()
  }

  return {
    title: `Đơn hàng #${order.display_id}`,
    description: `Xem đơn hàng`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const customer = await retrieveCustomer()
  if (!customer) notFound()
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order || order.customer_id !== customer.id) {
    notFound()
  }

  return <OrderDetailsTemplate order={order} />
}
