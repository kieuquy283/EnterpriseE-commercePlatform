import type { DeckSlide } from "../../engine/types.ts"

const sourceDocs = [
  "docs/spec/01-business.md",
  "docs/spec/02-flows.md",
  "docs/spec/03-architecture.md",
  "docs/spec/04-data-api.md",
  "docs/spec/05-testing.md",
  "docs/spec/06-operations.md",
  "docs/spec/07-delivery.md",
]

export const slides: DeckSlide[] = [
  {
    id: "business-problem",
    choreography: "cover",
    kicker: "MỤC TIÊU",
    title: "Quần áo mỗi ngày.\nMua sắm liền mạch.",
    lede:
      "DAYMARK giúp khách chọn đúng sản phẩm và kích cỡ, hiểu giá cùng tình trạng hàng, rồi biết đơn hàng đang ở đâu.",
    tone: "light",
    layout: "cover",
    blocks: [
      {
        type: "cards",
        columns: 3,
        items: [
          { eyebrow: "Khách cần", title: "Thông tin rõ", body: "Mẫu mã, kích cỡ, giá và hàng còn bán được." },
          { eyebrow: "Cửa hàng cần", title: "Một nguồn sự thật", body: "Giá, tồn kho và đơn hàng thống nhất." },
          { eyebrow: "Vận hành cần", title: "Theo dõi được", body: "Nhận đơn, giao hàng thủ công và đối soát COD." },
        ],
      },
    ],
    sources: sourceDocs,
  },
  {
    id: "actors",
    choreography: "rise",
    kicker: "NGƯỜI DÙNG",
    title: "Ba nhóm cùng hoàn tất một đơn hàng.",
    lede: "Mỗi vai trò có việc rõ ràng và cần dữ liệu đúng lúc.",
    blocks: [
      {
        type: "cards",
        columns: 3,
        items: [
          { eyebrow: "01 · Khách hàng", title: "Chọn và mua", body: "Tìm sản phẩm, chọn biến thể, thanh toán COD và xem trạng thái đơn của mình." },
          { eyebrow: "02 · Nhân viên vận hành", title: "Nhập kho và giao", body: "Cập nhật hàng, xử lý đơn, bàn giao cho hãng vận chuyển và đối soát tiền thu hộ." },
          { eyebrow: "03 · Quản trị viên", title: "Kiểm soát dịch vụ", body: "Quản lý tài khoản nhân viên, phát hành phiên bản, theo dõi lỗi và chi phí." },
        ],
      },
    ],
    sources: ["docs/spec/01-business.md", "docs/spec/02-flows.md"],
  },
  {
    id: "mvp-scope",
    choreography: "steps",
    kicker: "PHẠM VI MVP",
    title: "Chín use case cho một thương hiệu.",
    lede: "Một kho · COD · bàn giao carrier thủ công · gợi ý sản phẩm là phần nâng cao.",
    blocks: [
      {
        type: "cards",
        columns: 3,
        items: [
          { eyebrow: "01–05 · Khám phá và mua", title: "Từ tài khoản đến đơn", body: "Đăng nhập; duyệt và tìm; giỏ hàng; checkout; COD và xử lý thử nghiệm thanh toán trong môi trường riêng." },
          { eyebrow: "06–08 · Vận hành", title: "Từ kho đến giao hàng", body: "Nhập và giữ tồn; fulfillment; trạng thái đơn, tracking thủ công và thông báo khách hàng." },
          { eyebrow: "09 · Quản trị", title: "Điều hành cửa hàng", body: "Quản lý catalog, đơn hàng, tồn kho, quyền nhân viên và báo cáo cơ bản." },
        ],
      },
      { type: "note", tone: "info", text: "Gợi ý tương tự / phổ biến hỗ trợ khám phá, nhưng không được quyết định giá, tồn hoặc quyền mua." },
    ],
    sources: ["docs/spec/01-business.md", "docs/spec/02-flows.md"],
  },
  {
    id: "business-journey",
    choreography: "journey",
    kicker: "HÀNH TRÌNH NGHIỆP VỤ",
    title: "Từ nhận hàng đến đối soát COD.",
    lede: "Trạng thái đơn, giao hàng và thu tiền là các việc riêng; carrier không được giả định đã tích hợp.",
    blocks: [
      {
        type: "flow",
        dense: true,
        steps: [
          { label: "Kho", title: "Nhận và ghi tồn", detail: "Theo biến thể / SKU." },
          { label: "Catalog", title: "Đăng bán", detail: "Ảnh, giá, tồn." },
          { label: "Khám phá", title: "Chọn hàng", detail: "Duyệt, tìm, gợi ý." },
          { label: "Checkout", title: "Tạo một đơn", detail: "Kiểm tra giá và tồn." },
          { label: "Nhân viên", title: "Đóng và bàn giao", detail: "Ghi carrier, tracking." },
          { label: "Khách hàng", title: "Theo dõi trạng thái", detail: "Nhận thông báo." },
          { label: "Đối soát", title: "Khớp COD", detail: "Ghi tiền thực thu." },
        ],
      },
      {
        type: "note",
        tone: "fact",
        text: "Đây là hành trình mục tiêu để nghiệm thu; bản trình bày không khẳng định toàn bộ luồng đã được chứng minh.",
      },
    ],
    sources: ["docs/spec/02-flows.md", "docs/spec/04-data-api.md"],
  },
  {
    id: "architecture",
    choreography: "diagram",
    kicker: "KIẾN TRÚC ĐỀ XUẤT",
    title: "Kiến trúc DAYMARK.",
    lede: "API và worker là cách triển khai của cùng backend Medusa, không phải các microservice độc lập.",
    blocks: [
      {
        type: "diagram",
        label: "Kiến trúc DAYMARK: phân tuyến HTTPS, ứng dụng và nơi lưu dữ liệu",
        definition: `flowchart LR
  Customer["Khách hàng"] --> ALB["ALB · HTTPS"]
  Staff["Nhân viên / Admin"] --> ALB
  ALB --> Web["Next.js · Storefront"]
  ALB --> API["Medusa · API / Admin"]
  Web --> API
  API --> DB[("RDS PostgreSQL")]
  API <--> Redis[("Redis")]
  API --> S3[("S3 · Ảnh qua proxy")]
  Worker["Medusa Worker"] <--> Redis
  Worker --> DB`,
      },
    ],
    sources: ["docs/spec/03-architecture.md", "docs/spec/04-data-api.md"],
  },
  {
    id: "design-choices",
    choreography: "compare",
    kicker: "LỰA CHỌN THIẾT KẾ",
    title: "Giữ dữ liệu đúng. Đưa việc chậm ra nền.",
    lede: "Luồng checkout bảo toàn tính nhất quán; thông báo và gợi ý không giữ khách chờ.",
    blocks: [
      {
        type: "cards",
        columns: 2,
        items: [
          { eyebrow: "Nguồn dữ liệu", title: "Medusa quyết định", body: "Giá, tồn, cart, đơn và fulfillment do commerce backend quản lý; PostgreSQL lưu dữ liệu nghiệp vụ." },
          { eyebrow: "Đồng bộ", title: "Checkout xác nhận rõ", body: "Kiểm tra lại giá và tồn; retry cùng một giao dịch không tạo tác động đơn hàng lặp." },
          { eyebrow: "Bất đồng bộ", title: "Thông báo sau commit", body: "Worker thử lại có giới hạn, nhận diện sự kiện lặp và báo lỗi để nhân viên xử lý." },
          { eyebrow: "Tích hợp", title: "Provider và fallback", body: "COD / carrier thủ công trong MVP. Gợi ý sản phẩm có thể tắt hoặc fallback mà không chặn mua." },
        ],
      },
    ],
    sources: ["docs/spec/03-architecture.md", "docs/spec/04-data-api.md", "docs/spec/02-flows.md"],
  },
  {
    id: "quality-targets",
    choreography: "metrics",
    kicker: "MỤC TIÊU KIỂM THỬ",
    title: "Có con số, có cửa sổ đo, có đối soát.",
    lede: "Đây là mục tiêu đề xuất cho kiểm thử cô lập; chưa phải năng lực đã đạt.",
    blocks: [
      {
        type: "stats",
        items: [
          { value: "30", unit: "RPS · 10 phút", label: "Duyệt catalog", note: "p95 API <600 ms · lỗi <1%" },
          { value: "3", unit: "journeys/s · 5 phút", label: "Checkout", note: "p95 <1.500 ms · lỗi bất ngờ <1%" },
          { value: "0", label: "Tác động lặp", note: "Không đơn trùng, không bán vượt tồn trong ca tranh chấp." },
        ],
      },
      {
        type: "note",
        tone: "warn",
        title: "Trạng thái",
        text: "Mục tiêu chưa được xác nhận bằng lần chạy tải mới. Kết quả phải đối soát đơn hàng, payment và tồn kho; không chỉ nhìn HTTP 200.",
      },
    ],
    sources: ["docs/spec/05-testing.md"],
  },
  {
    id: "delivery-plan",
    choreography: "closing",
    kicker: "THỨ TỰ TRIỂN KHAI · TUẦN 6–10",
    title: "Chứng minh luồng cốt lõi trước khi mở rộng.",
    lede: "Các tuần sau bổ sung bằng chứng theo từng lớp; đây là kế hoạch, không phải báo cáo hoàn thành.",
    blocks: [
      {
        type: "roadmap",
        phases: [
          { phase: "TUẦN 6–7", title: "Catalog và đơn hàng", body: "Biến thể, ảnh, giá, tồn kho và quyền nhân viên; đi hết hành trình khách mua đến COD.", exit: "Walkthrough khách hàng và vận hành; kết quả nghiệp vụ được đối soát." },
          { phase: "TUẦN 8", title: "An toàn và vận hành", body: "Thông báo bất đồng bộ, retry / idempotency, CI/CD, dashboard và xử lý lỗi.", exit: "Chứng minh deploy, phân quyền, failure handling và cảnh báo." },
          { phase: "TUẦN 9–10", title: "Đo tải, đánh giá và demo", body: "Kiểm thử tải / phục hồi; đánh giá gợi ý và chuẩn bị demo cuối kỳ.", exit: "Công bố số đo, giới hạn, chi phí và chất lượng; không suy diễn kết quả." },
        ],
      },
    ],
    sources: ["docs/spec/07-delivery.md", "docs/spec/05-testing.md", "docs/spec/06-operations.md"],
  },
]
