'use client'

import { useToast, type ToastType } from '@/hooks/useToast'

function toastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
    case 'error':
      return 'border-red-500/40 bg-red-950/90 text-red-100'
    default:
      return 'border-violet-500/40 bg-zinc-900/95 text-zinc-100'
  }
}

export default function ToastContainer() {
  const toasts = useToast((s) => s.toasts)
  const removeToast = useToast((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg transition-opacity ${toastStyles(t.type)}`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-zinc-400 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
