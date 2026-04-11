import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { joinClasses } from './classes'

type SurfaceTone = 'default' | 'muted' | 'accent' | 'warning' | 'success'

type VariantButton = 'primary' | 'secondary' | 'ghost' | 'danger'

const surfaceClasses: Record<SurfaceTone, string> = {
  default: 'border-slate-800 bg-slate-900/80 shadow-2xl shadow-cyan-950/10',
  muted: 'border-slate-800 bg-slate-950/75',
  accent: 'border-cyan-400/30 bg-cyan-400/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  success: 'border-emerald-500/35 bg-emerald-500/10',
}

const buttonClasses: Record<VariantButton, string> = {
  primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400',
  secondary: 'border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800 disabled:border-slate-800 disabled:text-slate-600',
  ghost: 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white disabled:text-slate-600',
  danger: 'border-amber-500/40 text-amber-100 hover:bg-amber-500/10 disabled:border-slate-800 disabled:text-slate-600',
}

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone
}

export function Surface({ className, tone = 'default', ...props }: SurfaceProps) {
  return <div className={joinClasses('rounded-3xl border p-4 sm:p-6', surfaceClasses[tone], className)} {...props} />
}

interface SectionCardProps extends SurfaceProps {
  title: string
  tooltip: string
  note?: string
  children: ReactNode
}

export function SectionCard({ title, tooltip, note, className, children, ...props }: SectionCardProps) {
  return (
    <Surface className={joinClasses('h-full p-4', className)} {...props}>
      <Tooltip text={tooltip}>
        <p className="inline-block text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
      </Tooltip>
      <div className="mt-3 flex-1">{children}</div>
      {note ? <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p> : null}
    </Surface>
  )
}

export function CardGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClasses('grid gap-4 md:grid-cols-2', className)} {...props} />
}

export function PanelCard({ className, ...props }: SurfaceProps) {
  return <Surface className={joinClasses('h-full p-4 sm:p-5', className)} {...props} />
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VariantButton
  tooltip?: string
}

export function Button({ className, variant = 'primary', tooltip, ...props }: ButtonProps) {
  return (
    <button
      title={tooltip}
      className={joinClasses(
        'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-0 disabled:cursor-not-allowed',
        buttonClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  return (
    <span className="group relative inline-flex">
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-64 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-200 shadow-2xl shadow-black/40 group-hover:block group-focus-within:block">
        {text}
      </span>
      {children}
    </span>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, compact, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={joinClasses(
        'min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400',
        compact ? 'py-2' : 'py-2.5',
        className,
      )}
      {...props}
    />
  )
})

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={joinClasses(
        'min-h-20 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400',
        className,
      )}
      {...props}
    />
  )
}

interface StatProps {
  label: string
  value: string
}

export function StatChip({ label, value }: StatProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</span>
      <span className="mt-1 block break-words text-sm font-medium leading-5 text-white">{value}</span>
    </div>
  )
}

export function MetricCard({ label, value }: StatProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-left">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

interface RowProps {
  label: string
  value: ReactNode
}

export function InfoRow({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-3 border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
      <span className="min-w-0 text-sm leading-5 text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium leading-5 text-white">{value}</span>
    </div>
  )
}
