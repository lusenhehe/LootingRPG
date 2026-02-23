// 存放项目范围内可调的基础配置和UI尺寸

export const PLAYER_GROWTH = {
  baseAttack: 10,
  attackPerLevel: 5,
  baseHp: 100,
  hpPerLevel: 20,
  baseDefense: 5,
  defensePerLevel: 2,
  baseCritRate: 5,            // 以百分比计
  xpPerLevel: 100,
};

export const BATTLE_REWARD = {
  xpPerMonster: 20,
  xpPerBoss: 50,
};

export const UI_DIMENSIONS = {
  monsterIconSize: 22,      // 战斗面板中怪物图标大小
  codexIconSize: 32,        // 图鉴列表中图标尺寸
  nodeIconSize: 14,         // 地图节点（当用图标显示）
  waveBadgeWidth: 40,
  waveBadgeHeight: 16,
  progressBarWidth: 20,
  progressBarHeight: 2,
};

export const UI_STYLES = {
  nodeWaveLabel: 'text-[8px] px-1 rounded-bl bg-black/60',
};
