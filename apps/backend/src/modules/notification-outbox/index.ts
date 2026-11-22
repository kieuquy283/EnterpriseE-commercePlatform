import { Module } from "@medusajs/framework/utils"
import NotificationOutboxModuleService from "./service"

export const NOTIFICATION_OUTBOX_MODULE = "notificationOutbox"
export default Module(NOTIFICATION_OUTBOX_MODULE, {
  service: NotificationOutboxModuleService,
})
