import type { RefObject } from 'react'
import { type GameAction, type GameState } from '../../../domain/game'
import { selectOverviewScreenViewModel } from '../../../application/game/selectors'
import { OverviewControlDeck } from './OverviewControlDeck'
import { OverviewSnapshot } from './OverviewSnapshot'

interface OverviewScreenProps {
  state: GameState
  dispatch: (action: GameAction) => void
  clipPrice: string
  wireSpoolBatches: readonly [1, 5]
  wireBatchCosts: Record<1 | 5, number>
  priceInputRef: RefObject<HTMLInputElement | null>
}

export function OverviewScreen({ state, dispatch, clipPrice, wireSpoolBatches, wireBatchCosts, priceInputRef }: OverviewScreenProps) {
  const viewModel = selectOverviewScreenViewModel(state, clipPrice, wireSpoolBatches, wireBatchCosts)

  return (
    <div className="grid gap-4">
      <OverviewControlDeck
        state={state}
        dispatch={dispatch}
        clipPriceLabel={viewModel.clipPriceLabel}
        manualDisabled={viewModel.manualDisabled}
        manualNote={viewModel.manualNote}
        wireDescription={viewModel.wireDescription}
        wirePrimaryLabel={viewModel.wirePrimaryLabel}
        wirePrimaryTooltip={viewModel.wirePrimaryTooltip}
        wireSecondaryLabel={viewModel.wireSecondaryLabel}
        wireSecondaryTooltip={viewModel.wireSecondaryTooltip}
        wireDisabled={viewModel.wireDisabled}
        wireNote={viewModel.wireNote}
        priceDescription={viewModel.priceDescription}
        priceInputRef={priceInputRef}
        wireSpoolBatches={wireSpoolBatches}
      />

      <OverviewSnapshot state={state} />
    </div>
  )
}
