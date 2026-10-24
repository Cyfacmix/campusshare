import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => remove(id), 4500)
  }, [remove])

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {t.type === 'success'
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              : t.type === 'info'
                ? <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
            <p className="flex-1 text-sm">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Fermer" className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
