export interface BaseStats {
  hp: number
  attack: number
  defense: number
}

export interface BattleDerivedStats {
  damageReduction: number
  critRate?: number
  lifestealRate?: number
  thornsRate?: number
  elementalBonus?: number
}

export type Faction = 'player' | 'monster'

export type BattleStatusKind = 'dot' | 'hot' | 'buff' | 'debuff' | 'shield'

export interface BattleStatusInstance {
  id: string
  kind: BattleStatusKind
  sourceId?: string
  element?: string
  stacks: number
  remainingTurns: number
  magnitude: number
}

export interface BattleUnitInstance {
  id: string
  name: string
  faction: Faction
  level: number
  baseStats: BaseStats
  currentHp: number
  derivedStats: BattleDerivedStats
  skills: string[]
  passives: string[]
  elements: string[]
  tags: string[]
   // active buffs / debuffs / shields / dots
  statuses?: BattleStatusInstance[]
  meta?: Record<string, unknown>
}

export interface BattleUnitSchema {
  id: string
  name: string
  faction: Faction
  baseStats: BaseStats
  skills: string[]
  passives?: string[]
  elements?: string[]
  tags?: string[]
  aiProfile?: string
  derivedStats?: BattleDerivedStats
  meta?: Record<string, unknown>
}