import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập tài khoản DAYMARK.",
}

export default function Login() {
  return <LoginTemplate />
}
