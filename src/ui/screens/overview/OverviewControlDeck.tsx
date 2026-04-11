import type { RefObject, ReactNode } from 'react'
import { WIRE_PER_CLIP, WIRE_UNIT_LABEL, type GameAction, type GameState } from '../../../domain/game'
import { Button, Input, PanelCard, SectionCard } from '../../system'

interface OverviewControlDeckProps {
  state: GameState
  dispatch: (action: GameAction) => void
  clipPriceLabel: string
  manualDisabled: boolean
  manualNote?: string
  wireDescription: string
  wirePrimaryLabel: string
  wirePrimaryTooltip: string
  wireSecondaryLabel: string
  wireSecondaryTooltip: string
  wireDisabled: boolean
  wireNote: string
  priceDescription: string
  priceInputRef: RefObject<HTMLInputElement | null>
  wireSpoolBatches: readonly [1, 5]
}

export function OverviewControlDeck({
  state,
  dispatch,
  clipPriceLabel,
  manualDisabled,
  manualNote,
  wireDescription,
  wirePrimaryLabel,
  wirePrimaryTooltip,
  wireSecondaryLabel,
  wireSecondaryTooltip,
  wireDisabled,
  wireNote,
  priceDescription,
  priceInputRef,
  wireSpoolBatches,
}: OverviewControlDeckProps) {
  return (
    <PanelCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Core controls</p>
          <h3 className="font-display mt-2 text-xl font-semibold text-white sm:text-2xl">Make clips, buy wire, set price.</h3>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300">{clipPriceLabel}</div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SectionCard title="Make clip" tooltip="Produce one clip from one inch of wire." note={manualNote} className="bg-slate-950/60">
          <p className="text-sm leading-6 text-slate-300">Spend {WIRE_PER_CLIP} {WIRE_UNIT_LABEL.slice(0, -2)} of wire for one paperclip.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={manualDisabled} onClick={() => dispatch({ type: 'makeClip' })} type="button" tooltip={`Spend ${WIRE_PER_CLIP} ${WIRE_UNIT_LABEL.slice(0, -2)} of wire to make one paperclip.`}>
              Make paperclip
            </Button>
            <Button variant="secondary" tooltip={state.paused ? 'Resume the simulation.' : 'Pause the simulation.'} onClick={() => dispatch({ type: 'togglePause' })} type="button">
              {state.paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Buy wire" tooltip="Purchase spool-sized wire bundles." note={wireNote} className="bg-slate-950/60">
          <p className="text-sm leading-6 text-slate-300">{wireDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={wireDisabled} onClick={() => dispatch({ type: 'buyWire', amount: wireSpoolBatches[0] })} type="button" tooltip={wirePrimaryTooltip}>
              {wirePrimaryLabel}
            </Button>
            <Button disabled={wireDisabled} variant="secondary" onClick={() => dispatch({ type: 'buyWire', amount: wireSpoolBatches[1] })} type="button" tooltip={wireSecondaryTooltip}>
              {wireSecondaryLabel}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Price" tooltip="Adjust the clip price and reset the run." note={priceDescription} className="bg-slate-950/60">
          <div className="grid gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
            <Button
              variant="secondary"
              tooltip="Lower the current clip price by one cent."
              disabled={!state.earth.humanFlag}
              onClick={() => {
                const nextPrice = state.economy.clipPrice - 0.01
                dispatch({ type: 'setPrice', price: nextPrice })
                if (priceInputRef.current) {
                  priceInputRef.current.value = Math.max(0.01, nextPrice).toFixed(2)
                }
              }}
              type="button"
            >
              - $0.01
            </Button>
            <Button
              variant="secondary"
              tooltip="Raise the current clip price by one cent."
              disabled={!state.earth.humanFlag}
              onClick={() => {
                const nextPrice = state.economy.clipPrice + 0.01
                dispatch({ type: 'setPrice', price: nextPrice })
                if (priceInputRef.current) {
                  priceInputRef.current.value = nextPrice.toFixed(2)
                }
              }}
              type="button"
            >
              + $0.01
            </Button>
            <Input className="min-w-0" defaultValue={state.economy.clipPrice.toFixed(2)} inputMode="decimal" ref={priceInputRef} />
            <Button
              tooltip="Apply the entered price in dollars per clip."
              disabled={!state.earth.humanFlag}
              onClick={() => {
                const parsed = Number.parseFloat(priceInputRef.current?.value ?? '')
                if (!Number.isNaN(parsed)) {
                  dispatch({ type: 'setPrice', price: parsed })
                }
              }}
              type="button"
            >
              Apply
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="danger" tooltip="Reset to the original-style starting state." onClick={() => dispatch({ type: 'reset' })} type="button">
              Reset
            </Button>
          </div>
        </SectionCard>
      </div>
    </PanelCard>
  )
}
