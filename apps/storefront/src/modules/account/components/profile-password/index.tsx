"use client"

import React from "react"
import { Input } from "@modules/common/components/ui"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePassword: React.FC<MyInformationProps> = ({ customer: _customer }) => {
  const [error, setError] = React.useState<string | undefined>()

  // TODO(impl): Add password changes through the Medusa auth provider before enabling edits — FR-01/FLOW-01.
  const updatePassword = async () => {
    setError("Tính năng đổi mật khẩu chưa khả dụng. Mật khẩu hiện tại chưa được thay đổi.")
  }

  const clearState = () => {
    setError(undefined)
  }

  return (
    <form action={updatePassword} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label="Mật khẩu"
        currentInfo={
          <span className="text-dm-small text-ink-muted">Mật khẩu của bạn luôn được ẩn.</span>
        }
        isSuccess={false}
        isError={Boolean(error)}
        errorMessage={error}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
          <Input
            label="Mật khẩu hiện tại"
            name="old_password"
            required
            type="password"
            autoComplete="current-password"
            data-testid="old-password-input"
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            name="new_password"
            required
            autoComplete="new-password"
            data-testid="new-password-input"
          />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            name="confirm_password"
            required
            autoComplete="new-password"
            data-testid="confirm-password-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword
