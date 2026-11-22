import { MedusaService } from "@medusajs/framework/utils"
import NotificationAttempt from "./models/notification-attempt"
import NotificationRecord from "./models/notification-record"

export default class NotificationOutboxModuleService extends MedusaService({
  NotificationRecord,
  NotificationAttempt,
}) {}
