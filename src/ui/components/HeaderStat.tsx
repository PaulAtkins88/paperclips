interface HeaderStatProps {
  label: string
  value: string
}

export function HeaderStat({ label, value }: HeaderStatProps) {
  return (
    <div className="flex min-h-[5.25rem] w-full min-w-0 flex-col justify-between rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-left backdrop-blur">
      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold leading-5 text-white sm:text-base xl:text-sm 2xl:text-base">{value}</div>
    </div>
  )
}
