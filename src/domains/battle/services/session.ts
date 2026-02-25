import type { BattleEnemySnapshot, BattleResult, BattleSession, GameState, MapProgressState} from '../../../types/game';
import type { MapChapterDef, MapNodeDef, NodeWave } from '../../map/model/chapters';
import { getFinalPlayerStats } from '../../player/model/combat';
import { getFinalMonsterStats } from './monsterStats';
import { getMonsterById } from '../../monster/config';
import { applyMapNodeResult } from '../../map/services/progress';
import { PLAYER_GROWTH } from '../../game/config/progression';
import { recalculatePlayerStats } from '../../player/services/recalculatePlayerStats';
import { generateEquipment } from '../../inventory/services/equipment';

interface BattleTransition {
  nextGameState: GameState;
  nextMapProgress: MapProgressState;
  logs: string[];
  focusNodeId?: string;
  error?: string;
}

const toBattleLog = (message: string) => `[Battle] ${message}`;

const ensureNodeWaves = (node: MapNodeDef): NodeWave[] => {
  if (!node.waves || node.waves.length === 0) {
    throw new Error(`Node ${node.id} has no waves configured.`);
  }
  return node.waves;
};

const normalizeSessionWaves = (session: BattleSession): BattleSession => {
  const enemies = (session.enemies ?? []).map((enemy, index) => ({
    ...enemy,
    waveId: enemy.waveId || `wave-${index + 1}`,
  }));

  const inferredWaveOrder = Array.from(new Set(enemies.map((enemy) => enemy.waveId)));
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
  };
};

const buildEnemySnapshot = (
  node: MapNodeDef,
  wave: NodeWave,
  waveId: string,
  monsterId: string,
  enemyIndex: number,
  playerLevel: number,
  playerFinal: ReturnType<typeof getFinalPlayerStats>,
): BattleEnemySnapshot => {
  const monster = getMonsterById(monsterId);
  if (!monster) {
    throw new Error(`Monster '${monsterId}' not found in content config.`);
  }

  const isBoss = node.encounterType === 'boss' || monster.monsterType === 'boss';
  const finalMonster = getFinalMonsterStats(monster, playerLevel, enemyIndex, isBoss, playerFinal, node.id);

  return {
    id: `${waveId}-${monster.id}-${enemyIndex}`,
    monsterId: monster.id,
    name: monster.name,
    icon: monster.icons[0] ?? '👾',
    waveId,
    waveLabel: wave.label,
    maxHp: finalMonster.maxHp,
    hp: finalMonster.maxHp,
    attack: finalMonster.attack,
    damageReduction: finalMonster.damageReduction,
    isBoss,
    dropdict: monster.dropdict,
  };
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
    battle: {
      ...gameState.battle,
      activeSession: null,
    },
  };

  let xpGained = 0;
  let goldGained = 0;
  const logs: string[] = [];

  if (won) {
    xpGained = Math.max(15, node.recommendedLevel * 6 + session.enemies.length * 8);
    goldGained = node.firstClearRewardGold;

    const rewardEnemy = session.enemies.find((enemy) => enemy.isBoss) ?? session.enemies[session.enemies.length - 1];
    const drop = rewardEnemy
      ? generateEquipment(
          { monsterType: rewardEnemy.isBoss ? 'boss' : 'normal', dropdict: rewardEnemy.dropdict },
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

  nextState = {
    ...nextState,
    battle: {
      activeSession: null,
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
    const nodeWaves = ensureNodeWaves(node);
    const playerFinal = getFinalPlayerStats(gameState.playerStats, gameState.battle.history.length);

    const validWaves = nodeWaves
      .map((wave, index) => ({ wave, waveId: wave.id || `wave-${index + 1}` }))
      .filter(({ wave }) => Array.isArray(wave.monsters) && wave.monsters.length > 0);

    const enemies: BattleEnemySnapshot[] = [];
    let enemyIndex = 0;

    for (const { wave, waveId } of validWaves) {
      for (const waveMonster of wave.monsters) {
        enemies.push(
          buildEnemySnapshot(node, wave, waveId, waveMonster.monsterId, enemyIndex, gameState.playerStats.level, playerFinal),
        );
        enemyIndex += 1;
      }
    }

    if (enemies.length === 0) {
      throw new Error(`Node ${node.id} has no valid monsters in waves.`);
    }

    const session: BattleSession = {
      id: `battle_${Date.now()}`,
      chapterId: chapter.id,
      chapterName: chapter.name,
      nodeId: node.id,
      nodeName: node.name,
      encounterType: node.encounterType,
      turn: 0,
      playerMaxHp: playerFinal.maxHp,
      playerHp: playerFinal.maxHp,
      player: {
        attack: playerFinal.attack,
        damageReduction: playerFinal.damageReduction,
        critRate: playerFinal.critRate,
        lifestealRate: playerFinal.lifestealRate,
        thornsRate: playerFinal.thornsRate,
        elementalBonus: playerFinal.elementalBonus,
      },
      enemies,
      waveOrder: validWaves.map((entry) => entry.waveId),
      currentWaveIndex: 0,
      status: 'fighting',
      logs: [toBattleLog(`Entered ${chapter.name} - ${node.name}.`)],
    };

    return {
      nextGameState: {
        ...gameState,
        battle: {
          ...gameState.battle,
          activeSession: session,
        },
      },
      logs: [toBattleLog(`Challenge started: ${chapter.name} / ${node.name}.`)],
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

  const currentWaveId = session.waveOrder[session.currentWaveIndex];
  if (!currentWaveId) {
    return resolveBattleResult(gameState, mapProgress, chapters, session, true);
  }

  const nextSession: BattleSession = {
    ...session,
    turn: session.turn + 1,
    logs: [...session.logs],
    enemies: session.enemies.map((entry) => ({ ...entry })),
  };

  const waveEnemies = nextSession.enemies.filter((entry) => entry.waveId === currentWaveId && entry.hp > 0);
  if (waveEnemies.length === 0) {
    nextSession.currentWaveIndex += 1;
    if (nextSession.currentWaveIndex >= nextSession.waveOrder.length) {
      nextSession.status = 'victory';
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
        true,
      );
    }

    const nextWaveId = nextSession.waveOrder[nextSession.currentWaveIndex];
    const nextWaveLabel = nextSession.enemies.find((entry) => entry.waveId === nextWaveId)?.waveLabel;
    nextSession.logs.push(toBattleLog(`Wave cleared. ${nextWaveLabel ?? nextWaveId} is now incoming.`));

    return {
      nextGameState: {
        ...gameState,
        battle: {
          ...gameState.battle,
          activeSession: nextSession,
        },
      },
      nextMapProgress: mapProgress,
      logs: nextSession.logs.slice(-2),
    };
  }

  const nextEnemy = waveEnemies[0];
  const didCrit = Math.random() < nextSession.player.critRate;
  const critMultiplier = didCrit ? 1.6 : 1;
  const rawPlayerDamage = nextSession.player.attack * critMultiplier + nextSession.player.elementalBonus;
  const dealtDamage = Math.max(1, Math.floor(rawPlayerDamage * (1 - nextEnemy.damageReduction)));
  nextEnemy.hp = Math.max(0, nextEnemy.hp - dealtDamage);

  if (nextSession.player.lifestealRate > 0) {
    const heal = Math.floor(dealtDamage * nextSession.player.lifestealRate);
    nextSession.playerHp = Math.min(nextSession.playerMaxHp, nextSession.playerHp + heal);
  }

  nextSession.logs.push(toBattleLog(`Turn ${nextSession.turn}: dealt ${dealtDamage}${didCrit ? ' (CRIT)' : ''} to ${nextEnemy.name}.`));

  if (nextEnemy.hp <= 0) {
    nextSession.logs.push(toBattleLog(`${nextEnemy.name} defeated.`));
  }

  const aliveWaveEnemies = nextSession.enemies.filter((entry) => entry.waveId === currentWaveId && entry.hp > 0);

  if (aliveWaveEnemies.length > 0) {
    let totalIncomingDamage = 0;
    for (const attacker of aliveWaveEnemies) {
      const incomingDamage = Math.max(1, Math.floor(attacker.attack * (1 - nextSession.player.damageReduction)));
      totalIncomingDamage += incomingDamage;
      nextSession.playerHp = Math.max(0, nextSession.playerHp - incomingDamage);

      if (nextSession.player.thornsRate > 0) {
        const reflected = Math.max(0, Math.floor(incomingDamage * nextSession.player.thornsRate));
        attacker.hp = Math.max(0, attacker.hp - reflected);
        if (reflected > 0) {
          nextSession.logs.push(toBattleLog(`Reflected ${reflected} damage to ${attacker.name}.`));
        }
      }

      if (attacker.hp <= 0) {
        nextSession.logs.push(toBattleLog(`${attacker.name} was defeated by thorns.`));
      }
    }
    nextSession.logs.push(toBattleLog(`${aliveWaveEnemies.length} enemies dealt ${totalIncomingDamage} total damage to you.`));
  }

  if (nextSession.playerHp <= 0) {
    nextSession.status = 'defeat';
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
  }

  const remainingWaveEnemies = nextSession.enemies.filter((entry) => entry.waveId === currentWaveId && entry.hp > 0);
  if (remainingWaveEnemies.length === 0) {
    nextSession.currentWaveIndex += 1;
    if (nextSession.currentWaveIndex >= nextSession.waveOrder.length) {
      nextSession.status = 'victory';
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
        true,
      );
    }

    const nextWaveId = nextSession.waveOrder[nextSession.currentWaveIndex];
    const nextWaveLabel = nextSession.enemies.find((entry) => entry.waveId === nextWaveId)?.waveLabel;
    nextSession.logs.push(toBattleLog(`Wave cleared. ${nextWaveLabel ?? nextWaveId} is now incoming.`));
  }

  return {
    nextGameState: {
      ...gameState,
      battle: {
        ...gameState.battle,
        activeSession: nextSession,
      },
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
    status: 'retreated',
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
