import { forwardRef, useEffect } from 'react'
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
}
const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, type = 'button', ...props }) {
  return (
    <button type={type} disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900',
        VARIANTS[variant], SIZES[size], className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

const fieldCls = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600'

export const Input = forwardRef(function Input({ label, error, className, id, ...props }, ref) {
  const inputId = id || props.name
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1 block text-sm font-medium">{label}</label>}
      <input id={inputId} ref={ref} aria-invalid={Boolean(error)}
        className={cx(fieldCls, error ? 'border-red-500' : 'border-slate-300')} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, className, id, rows = 4, ...props }, ref) {
  const inputId = id || props.name
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1 block text-sm font-medium">{label}</label>}
      <textarea id={inputId} ref={ref} rows={rows} aria-invalid={Boolean(error)}
        className={cx(fieldCls, error ? 'border-red-500' : 'border-slate-300')} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select({ label, error, className, id, children, ...props }, ref) {
  const inputId = id || props.name
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1 block text-sm font-medium">{label}</label>}
      <select id={inputId} ref={ref} aria-invalid={Boolean(error)}
        className={cx(fieldCls, error ? 'border-red-500' : 'border-slate-300')} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

const BADGE_COLORS = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
}

export function Badge({ color = 'slate', className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE_COLORS[color], className)}>
      {children}
    </span>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cx('rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)} {...props}>
      {children}
    </div>
  )
}

export function Spinner({ className }) {
  return (
    <div className={cx('flex justify-center', className)} role="status" aria-label="Chargement">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  )
}

export function EmptyState({ title = 'Rien à afficher', description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <Icon className="mb-3 h-10 w-10 text-slate-400" />
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const message = error?.response?.data?.detail || error?.message || 'Impossible de charger les données.'
  return (
    <div className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/30">
      <AlertTriangle className="mb-3 h-9 w-9 text-red-500" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Réessayer</Button>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', loading, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  )
}

export function Pagination({ page, count, pageSize = 12, onChange }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (pages <= 1) return null
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</Button>
      <span className="px-2 text-sm text-slate-500">Page {page} sur {pages}</span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Suivant</Button>
    </nav>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Avatar({ name, src, size = 'md' }) {
  const dims = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-xl' }[size]
  if (src) return <img src={src} alt={name} className={cx('rounded-full object-cover', dims)} />
  const letters = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  return (
    <span className={cx('inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200', dims)}>
      {letters}
    </span>
  )
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && <span className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40"><Icon className="h-6 w-6" /></span>}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  )
}

export function QueryState({ query, children, empty }) {
  if (query.isLoading) return <Spinner className="py-16" />
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />
  return children(query.data) ?? empty ?? null
}
