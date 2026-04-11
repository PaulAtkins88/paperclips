import { Button, SectionCard } from '../system'

interface ActionPanelProps<TAction extends string> {
  title: string
  description: string
  primaryLabel: TAction
  secondaryLabel?: TAction
  tooltip?: string
  primaryTooltip?: string
  secondaryTooltip?: string
  onPrimary: () => void
  onSecondary?: () => void
  disabled?: boolean
  note?: string
  className?: string
}

export function ActionPanel<TAction extends string>({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  disabled,
  note,
  className,
  tooltip,
  primaryTooltip,
  secondaryTooltip,
}: ActionPanelProps<TAction>) {
  return (
    <SectionCard title={title} tooltip={tooltip ?? title} note={note} className={className}>
      <p className="text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={disabled} onClick={onPrimary} type="button" tooltip={primaryTooltip ?? String(primaryLabel)}>
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary ? (
          <Button disabled={disabled} onClick={onSecondary} type="button" variant="secondary" tooltip={secondaryTooltip ?? String(secondaryLabel)}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </SectionCard>
  )
}
