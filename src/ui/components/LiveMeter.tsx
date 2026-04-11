import { formatNumber } from '../../domain/game'
import { joinClasses } from '../classes'
import { Tooltip } from '../system'

export type MeterAccent = 'cyanish' | 'violet' | 'emerald'

interface LiveMeterProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  accent: MeterAccent
  tooltip: string
}

export function LiveMeter({ label, value, prefix, suffix, accent, tooltip }: LiveMeterProps) {
  const positive = Math.max(0, value)
  const width = Math.min(100, positive * 18 + 14)
  const accentClasses: Record<MeterAccent, string> = {
    cyanish: 'from-cyan-400/90 to-cyan-300',
    violet: 'from-violet-400/90 to-fuchsia-300',
    emerald: 'from-emerald-400/90 to-emerald-300',
  }

  return (
    <Tooltip text={tooltip}>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-2.5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
          <span>{label}</span>
          <span className="font-medium text-slate-200">
            {prefix ?? ''}
            {formatNumber(value, value >= 100 ? 0 : 2)}
            {suffix ? ` ${suffix}` : ''}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={joinClasses('h-full rounded-full bg-gradient-to-r transition-all', accentClasses[accent])} style={{ width: `${width}%` }} />
        </div>
      </div>
    </Tooltip>
  )
}
