/** Display labels only; Medusa option values and variant IDs stay unchanged. */
const colours: Record<string, string> = {
  IVR: "Ngà",
  BLK: "Đen",
  OLV: "Olive",
  CHR: "Than chì",
  NAT: "Mộc",
  WHT: "Trắng",
  BLU: "Xanh dương",
  SKY: "Xanh trời",
  NVY: "Xanh navy",
  STN: "Xám đá",
  OAT: "Yến mạch",
  SLT: "Xám phiến",
  STR: "Kẻ đen / ngà",
  GRY: "Xám",
  TU: "Một cỡ",
}
export function productOptionLabel(value: string): string {
  return (
    colours[value] ??
    ({
      Size: "Kích cỡ",
      Colour: "Màu sắc",
      Color: "Màu sắc",
      Variant: "Phân loại",
      Default: "Tiêu chuẩn",
    }[value] ||
      value)
  )
}
