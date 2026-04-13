import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

export type ToastVariant = 'success' | 'error'

export interface ToastMessage {
  id: number
  text: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (text: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            'pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium',
            'transition-all duration-300 ease-in-out',
            'min-w-[200px] max-w-[320px]',
            t.variant === 'success'
              ? 'bg-white border-green-200 text-green-700'
              : 'bg-white border-red-200 text-red-700',
          ].join(' ')}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const toast = useCallback((text: string, variant: ToastVariant = 'success') => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, text, variant }])
    const timeout = setTimeout(() => dismiss(id), 2000)
    timeoutsRef.current.set(id, timeout)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
