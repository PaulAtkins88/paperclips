import { Button, SectionCard } from '../system'
import type { ReactNode } from 'react'

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
  footer?: ReactNode
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
  footer,
}: ActionPanelProps<TAction>) {
  return (
    <SectionCard title={title} tooltip={tooltip ?? title} note={note} className={className}>
      <p className="text-sm leading-6 text-slate-300">{description}</p>
      {footer ? <div className="mt-4">{footer}</div> : null}
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
