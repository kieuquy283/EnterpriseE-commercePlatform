import { createHash } from "node:crypto"
import nodemailer from "nodemailer"
import type { NotificationTypes } from "@medusajs/framework/types"
import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"

export default class NotificationSmtpProviderService extends AbstractNotificationProviderService {
  static identifier = "smtp"

  async send(notification: NotificationTypes.ProviderSendNotificationDTO) {
    if (
      !["order-confirmation", "order-canceled"].includes(notification.template || "") ||
      !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(notification.to)
    ) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "notification_smtp_configuration")
    }
    const key = notification.provider_data?.idempotency_key
    const host = process.env.NOTIFICATION_SMTP_HOST
    const from = process.env.NOTIFICATION_SMTP_FROM
    const port = Number(process.env.NOTIFICATION_SMTP_PORT || "587")
    if (
      typeof key !== "string" ||
      !key ||
      !host ||
      !from ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "notification_smtp_configuration")
    }
    const secure = process.env.NOTIFICATION_SMTP_SECURE === "true"
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: process.env.NODE_ENV === "production" && !secure,
      ...(process.env.NOTIFICATION_SMTP_USER
        ? {
            auth: {
              user: process.env.NOTIFICATION_SMTP_USER,
              pass: process.env.NOTIFICATION_SMTP_PASSWORD,
            },
          }
        : {}),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      logger: false,
      debug: false,
    })
    const id = `<${createHash("sha256").update(key).digest("hex")}@notifications.daymark.invalid>`
    try {
      const result = await transport.sendMail({
        from,
        to: notification.to,
        messageId: id,
        subject:
          notification.template === "order-confirmation"
            ? "DAYMARK — Xác nhận đơn hàng"
            : "DAYMARK — Đơn hàng đã hủy",
        text: `DAYMARK\n${notification.template === "order-confirmation" ? "Đã tiếp nhận đơn hàng" : "Đã hủy đơn hàng"}: ${notification.data?.order_id}\nThanh toán COD chỉ được ghi nhận khi thực thu.`,
        disableFileAccess: true,
        disableUrlAccess: true,
      })
      if (!result.accepted?.length || result.rejected?.length)
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "smtp_rejected")
      return { id }
    } catch {
      // SMTP errors may contain recipient addresses or credentials.
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "notification_smtp_unavailable")
    } finally {
      transport.close()
    }
  }
}
