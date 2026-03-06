import type { BattleResult, BattleSession, GameState, MapProgressState} from '../../../shared/types/game';
import type { BattleUnitInstance, BattleUnitSchema } from '../../../types/battle/BattleUnit';
import type { MapChapterDef, MapNodeDef, NodeWave } from '../../map/model/chapters';
import { getFinalPlayerStats } from '../../player/model/combat';
import { getFinalMonsterStats } from './monsterStats';
import { getMonsterById } from '../../monster/config';
import { applyMapNodeResult } from '../../map/services/progress';
import { PLAYER_GROWTH } from '../../../config/game/gameConfig';
import { recalculatePlayerStats } from '../../player/services/recalculatePlayerStats';
import { generateEquipment } from '../../inventory/services/equipment';
import { createBattleUnit } from '../UnitFactory';
import { BattleEngine } from '../engine/BattleEngine';
import { registerPassiveListeners } from '../engine/skillsConfig';
import i18n from '../../../i18n';
interface BattleTransition {
  nextGameState: GameState;
  nextMapProgress: MapProgressState;
  logs: string[];
  focusNodeId?: string;
  error?: string;
}

const toBattleLog = (message: string) => `[Battle] ${message}`;

const getUnitMetaString = (unit: BattleUnitInstance, key: string): string | undefined => {
  const value = unit.meta?.[key];
  return typeof value === 'string' ? value : undefined;
};

const getUnitMetaBoolean = (unit: BattleUnitInstance, key: string): boolean => {
  return unit.meta?.[key] === true;
};

const getUnitMetaDropDict = (unit: BattleUnitInstance): Record<string, number> | undefined => {
  const value = unit.meta?.dropdict;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, number>;
};

const getWaveId = (unit: BattleUnitInstance, fallback: string): string => {
  return getUnitMetaString(unit, 'waveId') ?? fallback;
};

const ensureNodeWaves = (node: MapNodeDef): NodeWave[] => {
  if (!node.waves || node.waves.length === 0) {
    throw new Error(`Node ${node.id} has no waves configured.`);
  }
  return node.waves;
};
const normalizeSessionWaves = (session: BattleSession): BattleSession => {
  const enemies = (session.enemies ?? []).map((enemy, index) => ({
    ...enemy,
    meta: {
      ...(enemy.meta ?? {}),
      waveId: getWaveId(enemy, `wave-${index + 1}`),
    },
  }));

  const inferredWaveOrder = Array.from(new Set(enemies.map((enemy, index) => getWaveId(enemy, `wave-${index + 1}`))));
  const existingWaveOrder = Array.isArray(session.waveOrder) ? session.waveOrder : [];
  const waveOrder = existingWaveOrder.length > 0
    ? existingWaveOrder.filter((waveId) => inferredWaveOrder.includes(waveId))
    : inferredWaveOrder;
  const safeWaveOrder = waveOrder.length > 0 ? waveOrder : inferredWaveOrder;
  const maxWaveIndex = Math.max(0, safeWaveOrder.length - 1);
  const currentWaveIndex = Number.isFinite(session.currentWaveIndex)
    ? Math.max(0, Math.min(maxWaveIndex, session.currentWaveIndex))
    : 0;

  return {
    ...session,
    enemies,
    waveOrder: safeWaveOrder,
    currentWaveIndex,
    phase: session.phase ?? 'player_input',
    events: Array.isArray(session.events) ? session.events : [],
  };
};
const buildEnemyUnit = (
  node: MapNodeDef,
  wave: NodeWave,
  waveId: string,
  monsterId: string,
  enemyIndex: number,
  playerLevel: number,
  playerFinal: ReturnType<typeof getFinalPlayerStats>,
): BattleUnitInstance => {
  const monster = getMonsterById(monsterId);
  if (!monster) {
    throw new Error(`Monster '${monsterId}' not found in content config.`);
  }

  const isBoss = node.encounterType === 'boss' || monster.monsterType === 'boss';
  const finalMonster = getFinalMonsterStats(monster, playerLevel, enemyIndex, isBoss, playerFinal, node.id);

  const monsterSchema: BattleUnitSchema = {
    id: `${waveId}-${monster.id}-${enemyIndex}`,
    name: monster.name,
    faction: 'monster',
    baseStats: {
      hp: finalMonster.maxHp,
      attack: finalMonster.attack,
      defense: finalMonster.defense,
    },
    skills: monster.skills ?? [],
    passives: [],
    elements: [],
    tags: [monster.monsterType],
    aiProfile: 'default',
    derivedStats: {
      damageReduction: finalMonster.damageReduction,
    },
    meta: {
      monsterId: monster.id,
      icon: monster.icons[0] ?? '👾',
      waveId,
      waveLabel: wave.label,
      isBoss,
      dropdict: monster.dropdict,
    },
  };

  return createBattleUnit(monsterSchema, playerLevel);
};
const resolveBattleResult = (
  gameState: GameState,
  mapProgress: MapProgressState,
  chapters: MapChapterDef[],
  session: BattleSession,
  won: boolean,
): BattleTransition => {
  const nodeChapter = chapters.find((chapter) => chapter.id === session.chapterId);
  const node = nodeChapter?.nodes.find((entry) => entry.id === session.nodeId);

  if (!nodeChapter || !node) {
    return {
      nextGameState: {
        ...gameState,
        battle: {
          ...gameState.battle,
          activeSession: null,
        },
      },
      nextMapProgress: mapProgress,
      logs: [toBattleLog('Battle ended but map node could not be resolved.')],
      error: 'Map node not found',
    };
  }

  const mapResult = applyMapNodeResult({
    progress: mapProgress,
    chapters,
    chapterId: nodeChapter.id,
    nodeId: node.id,
    won,
  });

  let nextState: GameState = {
    ...gameState,
  };

  let xpGained = 0;
  let goldGained = 0;
  const logs: string[] = [];

  if (won) {
    xpGained = Math.max(15, node.recommendedLevel * 6 + session.enemies.length * 8);
    goldGained = node.firstClearRewardGold;

    const rewardEnemy = session.enemies.find((enemy) => getUnitMetaBoolean(enemy, 'isBoss')) ?? session.enemies[session.enemies.length - 1];
    const rewardDropDict = rewardEnemy ? getUnitMetaDropDict(rewardEnemy) : undefined;
    const drop = rewardEnemy
      ? generateEquipment(
          { monsterType: getUnitMetaBoolean(rewardEnemy, 'isBoss') ? 'boss' : 'normal', dropdict: rewardDropDict },
          gameState.pityCounts,
          gameState.playerStats.level,
        )
      : null;

    let nextXp = gameState.playerStats.xp + xpGained;
    let nextLevel = gameState.playerStats.level;
    while (nextXp >= nextLevel * PLAYER_GROWTH.xpPerLevel) {
      nextXp -= nextLevel * PLAYER_GROWTH.xpPerLevel;
      nextLevel += 1;
    }

    nextState = recalculatePlayerStats({
      ...nextState,
      playerStats: {
        ...nextState.playerStats,
        xp: nextXp,
        level: nextLevel,
        gold: nextState.playerStats.gold + goldGained,
      },
      pityCounts: drop?.newPity ?? nextState.pityCounts,
      droppedEquipment: drop?.item ?? null,
      backpack: drop?.item ? [...nextState.backpack, drop.item] : nextState.backpack,
    });

    logs.push(toBattleLog(`${session.nodeName} cleared.`));
    logs.push(toBattleLog(`Gained ${xpGained} XP and ${goldGained} gold.`));
    if (nextLevel > gameState.playerStats.level) {
      logs.push(toBattleLog(`Level up to Lv.${nextLevel}.`));
    }
    if (drop?.item) {
      logs.push(toBattleLog(`Loot acquired: ${drop.item.name}.`));
    }

    if (mapResult.unlockedNodeId) {
      logs.push(toBattleLog(`Unlocked node ${mapResult.unlockedNodeId}.`));
    }
    if (mapResult.unlockedChapterId) {
      logs.push(toBattleLog(`Unlocked chapter ${mapResult.unlockedChapterId}.`));
    }
  } else {
    logs.push(toBattleLog(`${session.nodeName} challenge failed.`));
  }

  const history: BattleResult = {
    sessionId: session.id,
    chapterId: session.chapterId,
    nodeId: session.nodeId,
    won,
    turns: session.turn,
    xpGained,
    goldGained,
    finishedAt: Date.now(),
  };

  const endedSession: BattleSession = {
    ...session,
    phase: 'finished',
    status: won ? 'victory' : 'defeat',
  };

  nextState = {
    ...nextState,
    battle: {
      ...nextState.battle,
      activeSession: endedSession,
      history: [...nextState.battle.history.slice(-39), history],
    },
  };

  return {
    nextGameState: nextState,
    nextMapProgress: mapResult.nextProgress,
    logs,
    focusNodeId: won ? mapResult.unlockedNodeId : session.nodeId,
  };
};
export const startBattleSession = (
  gameState: GameState,
  chapter: MapChapterDef,
  node: MapNodeDef,
): { nextGameState: GameState; logs: string[]; error?: string } => {
  try {
    /// 1. 验证节点配置
    // 确保节点有波次配置，并且每个波次至少有一个怪物
    const nodeWaves = ensureNodeWaves(node);
    //  2. 计算玩家最终属性
    const playerFinal = getFinalPlayerStats(gameState.playerStats, gameState.battle.history.length);
    //  3. 合法波次过滤：只保留那些配置了怪物的波次，并为每个怪物生成一个唯一的敌人ID（格式：waveId-monsterId-index）
    const validWaves = nodeWaves
      .map((wave, index) => ({ wave, waveId: wave.id || `wave-${index + 1}` }))
      .filter(({ wave }) => Array.isArray(wave.monsters) && wave.monsters.length > 0);
    //  4. 构建敌方单位：统一创建为 BattleUnitInstance
    const enemies: BattleUnitInstance[] = [];
    let enemyIndex = 0;
    //  5. 战斗会话构建：将所有信息整合到一个 BattleSession 对象中，
    //     包含玩家属性、敌人列表、当前波次状态等
    for (const { wave, waveId } of validWaves) {
      for (const waveMonster of wave.monsters) {
        enemies.push(
          buildEnemyUnit(node, wave, waveId, waveMonster.monsterId, enemyIndex, gameState.playerStats.level, playerFinal),
        );
        enemyIndex += 1;
      }
    }

    if (enemies.length === 0) {
      throw new Error(`Node ${node.id} has no valid monsters in waves.`);
    }
    // 6. 错误处理：如果在任何步骤中发生错误（例如配置缺失、数据异常等），
    // 捕获错误并返回一个包含错误信息的结果对象，确保调用方能够正确处理异常情况。
    const playerUnit = createBattleUnit(
      {
        id: 'player',
        name: 'Player',
        faction: 'player',
        baseStats: {
          hp: playerFinal.maxHp,
          attack: playerFinal.attack,
          defense: playerFinal.defense,
        },
        skills: ['poison_blade', 'flame_shield'],
        passives: [],
        elements: [],
        tags: ['player'],
        derivedStats: {
          damageReduction: playerFinal.damageReduction,
          critRate: playerFinal.critRate,
          lifestealRate: playerFinal.lifestealRate,
          thornsRate: playerFinal.thornsRate,
          elementalBonus: playerFinal.elementalBonus,
        },
      },
      gameState.playerStats.level,
    );

    // Phase 3.d — 被动监听器注册：在战斗开始时为所有单位注册 passive 技能监听器。
    // 之后 BattleListenerRegistry.fromSession() 会读取这些 unit.listeners，
    // 确保每回合开始时注册中心中就已存在所有被动效果。
    for (const passiveId of playerUnit.passives) {
      registerPassiveListeners(passiveId, playerUnit);
    }
    for (const enemy of enemies) {
      for (const passiveId of enemy.passives) {
        registerPassiveListeners(passiveId, enemy);
      }
    }

    const session: BattleSession = {
      id: `battle_${Date.now()}`,
      chapterId: chapter.id,
        chapterName: i18n.t(`map.${chapter.id}`),
      nodeId: node.id,
      nodeName: node.name,
      encounterType: node.encounterType,
      turn: 0,
      player: playerUnit,
      enemies,
      waveOrder: validWaves.map((entry) => entry.waveId),
      currentWaveIndex: 0,
      phase: 'player_input',
      status: 'fighting',
      events: [],
      logs: [toBattleLog(`Entered ${i18n.t(`map.${chapter.id}`)} - ${node.name}.`)],
    };
    // 7. 返回结果对象：包含更新后的游戏状态、日志信息以及可能的错误信息
    return {
      nextGameState: {
        ...gameState,
        battle: {
          ...gameState.battle,
          activeSession: session,
        },
      },
      logs: [toBattleLog(`Challenge started: ${i18n.t(`map.${chapter.id}`)} / ${node.name}.`)],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      nextGameState: gameState,
      logs: [toBattleLog(`Cannot start battle: ${message}`)],
      error: message,
    };
  }
};

export const runBattlePlayerAttack = (
  gameState: GameState,
  mapProgress: MapProgressState,
  chapters: MapChapterDef[],
  targetId?: string,
): BattleTransition => {
  const sessionRaw = gameState.battle.activeSession;
  if (!sessionRaw || sessionRaw.status !== 'fighting') {
    return {
      nextGameState: gameState,
      nextMapProgress: mapProgress,
      logs: [],
      error: 'No active battle session',
    };
  }

  const session = normalizeSessionWaves(sessionRaw);

  // 解析目标：优先使用玩家选择的目标，否则默认攻击第一个存活敌人
  const resolvedTarget = targetId
    ? session.enemies.find((e) => e.id === targetId && e.currentHp > 0)
    : session.enemies.find((e) => e.currentHp > 0);
  const playerActionOverride = resolvedTarget
    ? {
        id: `action_${session.turn + 1}_player`,
        type: 'basic_attack' as const,
        sourceId: session.player.id,
        targetIds: [resolvedTarget.id],
      }
    : undefined;

  const nextSession = BattleEngine.resolveTurn(session, playerActionOverride);

  if (nextSession.status === 'victory') {
    return resolveBattleResult(
      {
        ...gameState,
        battle: { ...gameState.battle, activeSession: nextSession },
      },
      mapProgress,
      chapters,
      nextSession,
      true,
    );
  }

  if (nextSession.status === 'defeat') {
    return resolveBattleResult(
      {
        ...gameState,
        battle: { ...gameState.battle, activeSession: nextSession },
      },
      mapProgress,
      chapters,
      nextSession,
      false,
    );
  }

  return {
    nextGameState: {
      ...gameState,
      battle: { ...gameState.battle, activeSession: nextSession },
    },
    nextMapProgress: mapProgress,
    logs: nextSession.logs.slice(-3),
  };
};

/**
 * 与 `runBattlePlayerAttack` 类似，但本回合让玩家使用指定技能。
 * 主要用于调试/测试按钮。技能是否在玩家的 `skills` 列表中不作检查。
 */
export const runBattlePlayerSkill = (
  gameState: GameState,
  mapProgress: MapProgressState,
  chapters: MapChapterDef[],
  skillId: string,
  targetId?: string,
): BattleTransition => {
  const sessionRaw = gameState.battle.activeSession;
  if (!sessionRaw || sessionRaw.status !== 'fighting') {
    return {
      nextGameState: gameState,
      nextMapProgress: mapProgress,
      logs: [],
      error: 'No active battle session',
    };
  }

  const session = normalizeSessionWaves(sessionRaw);
  // 解析目标：优先使用玩家选择的目标，否则默认第一个存活敌人
  const resolvedTarget = targetId
    ? session.enemies.find((e) => e.id === targetId && e.currentHp > 0)
    : session.enemies.find((e) => e.currentHp > 0);
  const playerAction = {
    id: `action_${session.turn + 1}_player`,
    type: 'skill' as const,
    sourceId: session.player.id,
    targetIds: resolvedTarget ? [resolvedTarget.id] : [],
    payload: { skillId },
  };

  const nextSession = BattleEngine.resolveTurn(session, playerAction);

  if (nextSession.status === 'victory') {
    return resolveBattleResult(
      {
        ...gameState,
        battle: { ...gameState.battle, activeSession: nextSession },
      },
      mapProgress,
      chapters,
      nextSession,
      true,
    );
  }

  if (nextSession.status === 'defeat') {
    return resolveBattleResult(
      {
        ...gameState,
        battle: { ...gameState.battle, activeSession: nextSession },
      },
      mapProgress,
      chapters,
      nextSession,
      false,
    );
  }

  return {
    nextGameState: {
      ...gameState,
      battle: { ...gameState.battle, activeSession: nextSession },
    },
    nextMapProgress: mapProgress,
    logs: nextSession.logs.slice(-3),
  };
};
export const runBattleRetreat = (
  gameState: GameState,
  mapProgress: MapProgressState,
  chapters: MapChapterDef[],
): BattleTransition => {
  const sessionRaw = gameState.battle.activeSession;
  if (!sessionRaw) {
    return {
      nextGameState: gameState,
      nextMapProgress: mapProgress,
      logs: [],
      error: 'No active battle session',
    };
  }

  const session = normalizeSessionWaves(sessionRaw);

  const nextSession: BattleSession = {
    ...session,
    status: 'defeat',
    phase: 'finished',
    logs: [...session.logs, toBattleLog('You retreated from battle.')],
  };

  return resolveBattleResult(
    {
      ...gameState,
      battle: {
        ...gameState.battle,
        activeSession: nextSession,
      },
    },
    mapProgress,
    chapters,
    nextSession,
    false,
  );
};

export const closeBattleResult = (
  gameState: GameState,
): { nextGameState: GameState; logs: string[]; focusNodeId?: string; error?: string } => {
  const session = gameState.battle.activeSession;
  if (!session) {
    return {
      nextGameState: gameState,
      logs: [],
      error: 'No active battle session',
    };
  }

  if (session.status === 'fighting') {
    return {
      nextGameState: gameState,
      logs: [],
      error: 'Battle is still in progress',
    };
  }

  return {
    nextGameState: {
      ...gameState,
      battle: {
        ...gameState.battle,
        activeSession: null,
      },
    },
    logs: [toBattleLog('Battle settlement closed.')],
    focusNodeId: session.nodeId,
  };
};
