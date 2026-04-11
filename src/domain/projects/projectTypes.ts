import type { GameState } from '../game'

export type ProjectId =
  | 'project1'
  | 'project2'
  | 'project3'
  | 'project18'
  | 'project20'
  | 'project21'
  | 'project27'
  | 'project28'
  | 'project29'
  | 'project30'
  | 'project31'
  | 'project37'
  | 'project38'
  | 'project4'
  | 'project5'
  | 'project6'
  | 'project60'
  | 'project61'
  | 'project62'
  | 'project63'
  | 'project64'
  | 'project65'
  | 'project66'
  | 'project7'
  | 'project8'
  | 'project9'
  | 'project10'
  | 'project10b'
  | 'project11'
  | 'project12'
  | 'project13'
  | 'project14'
  | 'project15'
  | 'project17'
  | 'project19'
  | 'project35'
  | 'project41'
  | 'project43'
  | 'project44'
  | 'project45'
  | 'project46'
  | 'project22'
  | 'project23'
  | 'project24'
  | 'project25'
  | 'project26'
  | 'project70'
  | 'project118'
  | 'project119'
  | 'project120'
  | 'project121'
  | 'project129'
  | 'project132'
  | 'project133'
  | 'project134'
  | 'project131'
  | 'project127'
  | 'project34'

export type ProjectCostUnit = 'ops' | 'creativity' | 'trust' | 'dollars' | 'yomi' | 'clips' | 'mwSeconds'

export interface ProjectCost {
  amount: number
  unit: ProjectCostUnit
}

export interface ProjectDefinition {
  id: ProjectId
  title: string
  description: string
  isVisible: (state: GameState) => boolean
  canActivate: (state: GameState) => boolean
  getCost: (state: GameState) => ProjectCost[]
  apply: (state: GameState) => GameState
  repeatable?: boolean
}

export interface VisibleProject {
  id: ProjectId
  title: string
  description: string
  costs: ProjectCost[]
  canActivate: boolean
  completed: boolean
  repeatable: boolean
}
