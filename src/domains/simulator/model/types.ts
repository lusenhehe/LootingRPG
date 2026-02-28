// ─── 战斗模拟器领域类型 ──────────────────────────────────────────────────────────
// 放置于 domains/simulator/model 供 service 使用，tools 层从此处导入

/** 玩家预设配置（从 player_presets.json 读取） */
export interface PlayerPreset {
  id: string;
  name: string;
  level: number;
  /** 可选：覆盖基础公式计算值的原始属性 */
  statsOverride?: {
    hp?: number;
    attack?: number;
    defense?: number;
    critRate?: number;
    lifesteal?: number;
    thorns?: number;
    elemental?: number;
    attackSpeed?: number;
  };
}

/** 地图（怪物）基础数值倍率，1.0 = 原始值 */
export interface MapScaleConfig {
  hpMult: number;
  attackMult: number;
  defenseMult: number;
}

export const DEFAULT_MAP_SCALE: MapScaleConfig = {
  hpMult: 1.0,
  attackMult: 1.0,
  defenseMult: 1.0,
};

/** 模拟器输入配置 */
export interface SimulatorConfig {
  preset: PlayerPreset;
  chapterId: string;
  nodeId: string;
  iterations: number;
  mapScale: MapScaleConfig;
}

/** 可选：基线覆盖，用于在模拟器中临时调整基础成长（不会修改配置文件） */
export interface BaselinePiece {
  baseline: number;
  levelAdder: number;
}

export interface BaselineOverride {
  hp: BaselinePiece;
  attack: BaselinePiece;
  defense: BaselinePiece;
}

/** 单次模拟中某波次的结果快照 */
export interface WaveSnapshot {
  waveId: string;
  waveLabel: string;
  waveIndex: number;
  /** 波次结束时玩家剩余 HP（0 表示此波期间死亡） */
  playerHpRemaining: number;
  /** 波次结束时玩家最大 HP */
  playerHpMax: number;
  /** 玩家在此波次结束时是否存活 */
  survived: boolean;
}

/** 单次模拟运行的完整结果 */
export interface SimulationRun {
  won: boolean;
  totalTurns: number;
  waves: WaveSnapshot[];
}

/** 多次迭代后聚合的单波统计结果 */
export interface WaveStat {
  waveId: string;
  waveLabel: string;
  waveIndex: number;
  /** 百分比，例如 78.5 代表 78.5% */
  survivalRate: number;
  avgHpPct: number;
  minHpPct: number;
  maxHpPct: number;
  /** 此波次玩家平均剩余 HP（原始值） */
  avgHpRaw: number;
}

/** 最终聚合报告 */
export interface SimulationReport {
  chapterId: string;
  chapterName: string;
  nodeId: string;
  nodeName: string;
  iterations: number;
  actualRuns: number;
  overallWinRate: number;
  avgTurns: number;
  waveStats: WaveStat[];
  completionRate: number;
}
