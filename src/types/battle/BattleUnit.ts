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

/**
 * Opaque listener definition stored on units.
 * Uses `unknown` context to avoid circular dependency with shared/types/game.
 * The engine casts ctx to ListenerContext when executing.
 */
export interface BattleListenerDef {
  id: string
  ownerId: string
  /** Matches BattleEvent['type'] at runtime; typed as string to avoid circular dep */
  trigger: string
  /** If true, listener is removed automatically after first execution */
  once?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(ctx: any): void
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
  /** active的状态 */
  statuses?: BattleStatusInstance[]
  /** 注册的事件监听器（技能、被动、状态、装备效果） */
  listeners?: BattleListenerDef[]
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