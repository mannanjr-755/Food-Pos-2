import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close dialog',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/45 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={`lex-scale-in relative z-10 flex max-h-[92vh] w-full ${widths[size] || widths.md} flex-col overflow-hidden rounded-t-2xl border border-lex-700 bg-lex-850 shadow-panel sm:rounded-2xl`}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-lex-700 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-lex-ink">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="lex-press rounded-lg p-1.5 text-lex-muted transition hover:bg-lex-700 hover:text-lex-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="lex-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-lex-700 bg-lex-900/50 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
