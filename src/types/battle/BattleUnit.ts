// 这个文件定义了战斗单位的数据结构，
// 包括玩家和怪物的基本属性、技能、AI行为等信息。
export interface BaseStats {
  hp: number       // 生命值
  attack: number   // 攻击力
  defense: number  // 防御力
  speed: number    // 速度，决定行动顺序
}// 未来可以根据需要添加更多属性，例如暴击率、元素抗性等。
export type Faction = 'player' | 'monster'
export interface BattleUnitSchema {
  id: string // 唯一标识符
  name: string // 显示名称
  faction: Faction // 阵营，决定友敌关系
  baseStats: BaseStats // 基础属性
  growthProfile?: string // 可选的成长曲线，决定升级时属性的增长方式
  elements?: string[] // 可选的元素属性，例如火、水、风等，影响技能效果和相克关系
  tags?: string[] // 可选的标签，用于分类和触发特定效果，例如“boss”、“undead”、“flying”等
  positionPreference?: 'front' | 'middle' | 'back' // 可选的位置偏好，影响战斗中的站位
  skills: string[] // 技能列表，引用技能ID
  passives?: string[] // 被动技能列表，引用技能ID
  aiProfile?: string // AI行为模式，决定怪物的行动逻辑
  lootTable?: string // 掉落表，决定战斗胜利后的奖励
  difficultyWeight?: number // 难度权重，影响战斗难度和奖励
}