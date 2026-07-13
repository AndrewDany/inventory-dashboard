import { useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X } from 'lucide-react'

export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void
  onClose: () => void
}) {
  const containerId = 'barcode-scanner-container'
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        },
        (decodedText) => {
          if (hasScannedRef.current || cancelled) return
          hasScannedRef.current = true
          onScan(decodedText)
        },
        () => {
          // ignore per-frame scan errors (no code detected yet)
        }
      )
      .then(() => {
        if (cancelled) {
          scanner.stop().catch(() => {})
          return
        }
        isRunningRef.current = true
      })
      .catch((err) => {
        console.error('Camera start failed:', err)
      })

    return () => {
      cancelled = true
      if (isRunningRef.current) {
        scanner
          .stop()
          .then(() => {
            isRunningRef.current = false
          })
          .catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
      >
        <X size={24} />
      </button>

      <p className="text-white text-sm mb-4">Point your camera at a barcode or QR code</p>

      <div
        id={containerId}
        className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-white/30"
      />
    </div>
  )
}