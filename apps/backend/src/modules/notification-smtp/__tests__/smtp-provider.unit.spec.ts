import nodemailer from "nodemailer"
import NotificationSmtpProviderService from "../provider"

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}))

const original = { ...process.env }
const notification = {
  to: "customer@example.invalid",
  channel: "email",
  template: "order-confirmation",
  data: { order_id: "order_fixture" },
  provider_data: { idempotency_key: "stable-notification-key" },
}

afterEach(() => {
  process.env = { ...original }
  jest.resetAllMocks()
})

it("refuses an unconfigured SMTP target before attempting delivery", async () => {
  delete process.env.NOTIFICATION_SMTP_HOST
  await expect(new NotificationSmtpProviderService().send(notification)).rejects.toThrow(
    "notification_smtp_configuration",
  )
  expect(nodemailer.createTransport).not.toHaveBeenCalled()
})

it("requires TLS in production and uses a stable message identity", async () => {
  process.env.NODE_ENV = "production"
  process.env.NOTIFICATION_SMTP_HOST = "smtp.example.invalid"
  process.env.NOTIFICATION_SMTP_FROM = "store@example.invalid"
  const sendMail = jest.fn().mockResolvedValue({ accepted: [notification.to], rejected: [] })
  const close = jest.fn()
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({ sendMail, close } as unknown as ReturnType<
      typeof nodemailer.createTransport
    >)
  const first = await new NotificationSmtpProviderService().send(notification)
  const second = await new NotificationSmtpProviderService().send(notification)
  expect(first.id).toBe(second.id)
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ requireTLS: true, logger: false, debug: false }),
  )
  expect(sendMail.mock.calls[0][0]).toMatchObject({
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  expect(close).toHaveBeenCalledTimes(2)
})

it("sanitizes SMTP failure and closes the transport", async () => {
  process.env.NOTIFICATION_SMTP_HOST = "smtp.example.invalid"
  process.env.NOTIFICATION_SMTP_FROM = "store@example.invalid"
  const close = jest.fn()
  jest.mocked(nodemailer.createTransport).mockReturnValue({
    sendMail: jest.fn().mockRejectedValue(new Error("private credentials or recipient")),
    close,
  } as unknown as ReturnType<typeof nodemailer.createTransport>)
  await expect(new NotificationSmtpProviderService().send(notification)).rejects.toThrow(
    "notification_smtp_unavailable",
  )
  expect(close).toHaveBeenCalledTimes(1)
})
