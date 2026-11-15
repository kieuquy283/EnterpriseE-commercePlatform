/** Translate known commerce failures without exposing transport details or credentials. */
export function customerErrorMessage(error: string): string {
  if (/[à-ỹÀ-ỸđĐ]/u.test(error)) return error
  if (/invalid.*(credential|password)|unauthorized|email.*password/i.test(error))
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại."
  if (/already exists|already.*registered/i.test(error))
    return "Email này đã được sử dụng. Bạn có thể đăng nhập vào tài khoản."
  if (/inventory|stock|not enough|insufficient/i.test(error))
    return "Sản phẩm không còn đủ số lượng. Vui lòng kiểm tra lại giỏ hàng."
  if (/promotion|discount|promo/i.test(error))
    return "Mã ưu đãi chưa hợp lệ hoặc không áp dụng cho đơn hàng này."
  if (/shipping|delivery|address/i.test(error))
    return "Vui lòng kiểm tra địa chỉ và phương thức giao hàng."
  if (/payment/i.test(error))
    return "Không thể xử lý thanh toán. Vui lòng kiểm tra phương thức và thử lại."
  if (/cart.*(not found|expired|missing)|no existing cart/i.test(error))
    return "Giỏ hàng không còn khả dụng. Vui lòng quay lại giỏ hàng."
  return "Không thể hoàn tất thao tác. Vui lòng thử lại sau giây lát."
}
