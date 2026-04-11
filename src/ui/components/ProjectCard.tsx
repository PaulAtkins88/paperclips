import { formatProjectCosts } from '../../domain/projects/projectRegistry'
import { type ProjectCost, type ProjectId } from '../../domain/game'
import { joinClasses } from '../classes'
import { Button, PanelCard, Tooltip } from '../system'

interface ProjectCardProps<TId extends ProjectId> {
  id: TId
  title: string
  description: string
  costs: ProjectCost[]
  completed: boolean
  canAfford: boolean
  repeatable: boolean
  onComplete: () => void
}

export function ProjectCard<TId extends ProjectId>({ id, title, description, costs, completed, canAfford, repeatable, onComplete }: ProjectCardProps<TId>) {
  const costLabel = formatProjectCosts(costs)

  return (
    <Tooltip text={`${title} costs ${costLabel}.`}>
      <div className="h-full">
        <PanelCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={joinClasses('text-xs uppercase tracking-[0.3em]', completed ? 'text-emerald-300' : 'text-slate-500')}>
                {id}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">{costLabel}</div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              disabled={(!repeatable && completed) || !canAfford}
              onClick={onComplete}
              type="button"
              variant={completed && !repeatable ? 'secondary' : 'primary'}
              tooltip={completed && !repeatable ? `${title} already completed.` : `Spend ${costLabel} to activate ${title}.`}
            >
              {completed && !repeatable ? 'Completed' : repeatable ? 'Activate' : 'Fund project'}
            </Button>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{completed && !repeatable ? 'Unlocked' : canAfford ? 'Ready' : 'Insufficient resources'}</span>
          </div>
        </PanelCard>
      </div>
    </Tooltip>
  )
}
