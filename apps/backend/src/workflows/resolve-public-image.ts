import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

const imageTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
}

export function resolvePublicImage(key: string) {
  const segments = key.split("/")
  const extension = key.split(".").pop()?.toLowerCase() || ""
  const contentType = Object.prototype.hasOwnProperty.call(imageTypes, extension)
    ? imageTypes[extension]
    : undefined

  if (
    process.env.S3_PUBLIC_IMAGE_PROXY !== "true" ||
    !process.env.S3_BUCKET ||
    !key.startsWith("public-images/") ||
    segments.length !== 2 ||
    Buffer.byteLength(key, "utf8") > 1024 ||
    /[\\\x00-\x1f\x7f]/.test(key) ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    !contentType
  ) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Image not found")
  }

  return { key, contentType }
}

const resolvePublicImageStep = createStep(
  "resolve-public-image",
  async ({ key }: { key: string }) => new StepResponse(resolvePublicImage(key))
)

export const resolvePublicImageWorkflow = createWorkflow(
  "resolve-public-image",
  (input: { key: string }) => new WorkflowResponse(resolvePublicImageStep(input))
)
