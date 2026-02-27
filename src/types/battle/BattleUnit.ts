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
 * 怪物的技能、被动、状态效果等需要注册事件监听器来实现复杂逻辑；
 * BattleListenerDef定义了这些监听器的结构和行为
 * 
 *  - `trigger`字段指定了监听器响应的事件类型，通常对应于BattleEvent['type']，但为了避免循环依赖，这里使用string类型
 *  - `execute`方法在事件触发时被调用，接收一个上下文对象（ctx），其中包含了事件相关的数据和当前战斗状态，具体结构根据事件类型而异
 *  - `once`字段如果为true，表示监听器在执行一次后会自动移除，适用于只需要响应一次的效果，如一次性的反击或触发后消失的buff
 */
export interface BattleListenerDef {
  id: string
  ownerId: string,
  trigger: string,
  once?: boolean,
  execute(ctx: unknown): void
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