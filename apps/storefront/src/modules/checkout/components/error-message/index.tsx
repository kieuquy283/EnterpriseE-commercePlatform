import { customerErrorMessage } from "@lib/util/customer-error-message"

const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: string | null
  "data-testid"?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <div className="dm-error-text mt-2 leading-relaxed" role="alert" data-testid={dataTestid}>
      <span>{customerErrorMessage(error)}</span>
    </div>
  )
}

export default ErrorMessage
