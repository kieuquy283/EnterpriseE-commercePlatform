import { customerErrorMessage } from "@lib/util/customer-error-message"
import { Alert, Button, clx } from "@modules/common/components/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.",
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <section
      className="flex flex-col gap-y-3"
      data-testid={dataTestid}
      aria-busy={pending || undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-y-1">
          <h2 className="dm-eyebrow">{label}</h2>
          <div
            className={clx("min-w-0 break-words text-dm-body text-ink", state && "text-ink-muted")}
          >
            {typeof currentInfo === "string" ? (
              <span data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="small"
          className="shrink-0"
          onClick={handleToggle}
          type={state ? "reset" : "button"}
          aria-expanded={state}
          data-testid="edit-button"
          data-active={state}
        >
          {state ? "Huỷ" : "Chỉnh sửa"}
        </Button>
      </div>

      {isSuccess && (
        <div data-testid="success-message">
          <Alert tone="success">{label} đã được cập nhật.</Alert>
        </div>
      )}

      {isError && (
        <div data-testid="error-message">
          <Alert tone="error">{customerErrorMessage(errorMessage)}</Alert>
        </div>
      )}

      {state && (
        <div className="dm-panel flex flex-col gap-y-4 p-4">
          <div>{children}</div>
          <div className="flex justify-end">
            <Button
              isLoading={pending}
              loadingLabel="Đang lưu"
              className="w-full small:w-auto"
              type="submit"
              data-testid="save-button"
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AccountInfo
