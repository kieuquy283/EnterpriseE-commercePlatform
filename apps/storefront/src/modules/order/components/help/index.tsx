import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Help = () => {
  return (
    <section className="dm-panel flex flex-col gap-y-3 p-5">
      <h2 className="text-dm-small font-semibold text-ink">Bạn cần hỗ trợ?</h2>
      <p className="dm-caption">
        Bạn cần hỏi về đơn hàng, giao hàng hoặc đổi trả? Chúng tôi sẵn sàng hỗ trợ.
      </p>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <li>
          <LocalizedClientLink href="/#daymark-service" className="dm-link text-dm-small">
            Liên hệ
          </LocalizedClientLink>
        </li>
        <li>
          <LocalizedClientLink href="/#daymark-service" className="dm-link text-dm-small">
            Đổi và trả hàng
          </LocalizedClientLink>
        </li>
      </ul>
    </section>
  )
}

export default Help
