"use client"

import { getPersonalizationConsent, setPersonalizationConsent } from "@lib/data/personalization"
import { Alert, Button, SpinnerMark } from "@modules/common/components/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PersonalizationConsent() {
  const router = useRouter()
  const [granted, setGranted] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    void getPersonalizationConsent().then((value) => {
      setGranted(value)
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <p className="flex items-center gap-x-2 text-dm-small text-ink-faint" role="status">
        <SpinnerMark />
        Đang tải cài đặt gợi ý
      </p>
    )
  }

  if (granted === null) {
    return (
      <p className="text-dm-small text-ink-faint" role="status">
        Chưa thể tải cài đặt cá nhân hoá.
      </p>
    )
  }

  async function change() {
    setBusy(true)
    setError(false)
    const next = !granted
    const saved = await setPersonalizationConsent(next)
    if (saved) {
      setGranted(next)
      router.refresh()
    } else setError(true)
    setBusy(false)
  }

  return (
    <section
      aria-labelledby="personalization-heading"
      className="flex flex-col gap-y-3 border-t border-line pt-8"
    >
      <h2 id="personalization-heading" className="dm-heading">
        Gợi ý sản phẩm
      </h2>
      <p className="dm-body max-w-dm-prose">
        Cho phép cửa hàng sử dụng lượt xem và lượt nhấn gợi ý để đề xuất sản phẩm phù hợp với bạn.
        Bạn có thể tắt bất cứ lúc nào.
      </p>
      <Button
        type="button"
        onClick={change}
        disabled={busy}
        isLoading={busy}
        loadingLabel="Đang lưu lựa chọn"
        aria-pressed={granted}
        variant="secondary"
        size="small"
        className="self-start"
      >
        {granted ? "Tắt gợi ý cá nhân" : "Bật gợi ý cá nhân"}
      </Button>
      {error && <Alert tone="error">Không thể cập nhật lựa chọn. Vui lòng thử lại.</Alert>}
    </section>
  )
}
