// UnitFactory.ts
// 负责创建战斗单位实例的工厂函数
// 通过传入单位的基础数据和等级，生成一个完整的战斗单位对象
// 战斗层不要再直接读取 monster JSON
// 必须通过 UnitFactory 生成战斗单位
import { BattleUnitSchema } from '@src/types/battle/BattleUnit'
export function createBattleUnit(
  data: BattleUnitSchema,
  level: number
) {
  return {
    id: data.id,
    name: data.name,
    faction: data.faction,
    level,
    baseStats: { ...data.baseStats },
    currentHp: data.baseStats.hp,
    skills: [...data.skills],
    passives: data.passives ?? [],
    elements: data.elements ?? [],
    tags: data.tags ?? [],
    aiProfile: data.aiProfile ?? 'default'
  }
}