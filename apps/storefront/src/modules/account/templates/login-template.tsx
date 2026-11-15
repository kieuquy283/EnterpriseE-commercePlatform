"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="grid w-full gap-12 small:grid-cols-2 small:gap-24">
      <div className="border-b border-line pb-10 small:border-b-0">
        <h2 className="dm-display max-w-[12ch]">Không gian của bạn.</h2>
        <p className="dm-lead mt-6 max-w-sm">
          Lưu thông tin, xem lại những món đã chọn và theo dõi đơn hàng của bạn.
        </p>
      </div>
      <div className="w-full max-w-lg small:border-l small:border-line small:pl-12">
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>
    </div>
  )
}

export default LoginTemplate
