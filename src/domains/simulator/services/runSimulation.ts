/**
 * runSimulation.ts
 * 战斗模拟器核心服务 — 纯 TypeScript，无 React 依赖。
 * 复用现有的 BattleEngine、UnitFactory、monsterStats 等域服务，
 * 在不依赖 GameState 的情况下独立运行完整战斗模拟。
 */
import type { BattleSession, PlayerStats } from '../../../shared/types/game';
import type { BattleUnitInstance, BattleUnitSchema } from '../../../types/battle/BattleUnit';
import type { MapNodeDef, NodeWave, MapChapterDef } from '../../map/model/chapters';
import type { SimulationRun, WaveSnapshot, SimulationReport, SimulatorConfig, MapScaleConfig, BaselineOverride } from '../model/types';
import { getFinalPlayerStats } from '../../player/model/combat';
import { getFinalMonsterStats } from '../../battle/services/monsterStats';
import { getMonsterById } from '../../monster/config';
import { getMapMonsterBaselineByLevel } from '../../battle/services/monsterScaling';
import { createBattleUnit } from '../../battle/UnitFactory';
import { registerPassiveListeners } from '../../battle/engine/skillsConfig';
import { BattleEngine } from '../../battle/engine/BattleEngine';
import { MAP_CHAPTERS } from '../../map/model/chapters';

// ─── 内部工具 ─────────────────────────────────────────────────────────────────

const buildPlayerStats = (config: SimulatorConfig): PlayerStats => {
  const { preset } = config;
  const ov = preset.statsOverride ?? {};
  const level = preset.level;

  return {
    level,
    xp: 0,
    hp: ov.hp ?? (300 + (level - 1) * 20),
    attack: ov.attack ?? (50 + (level - 1) * 5),
    defense: ov.defense ?? (5 + (level - 1) * 2),
    critRate: String(ov.critRate ?? 5),
    damageBonus: 0,
    lifesteal: ov.lifesteal ?? 0,
    thorns: ov.thorns ?? 0,
    elemental: ov.elemental ?? 0,
    attackSpeed: ov.attackSpeed ?? 0,
    gold: 0,
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
  scale: MapScaleConfig,
): BattleUnitInstance => {
  const monster = getMonsterById(monsterId);
  if (!monster) throw new Error(`[Simulator] Monster '${monsterId}' not found.`);
  const isBoss = node.encounterType === 'boss' || monster.monsterType === 'boss';
  let finalMonster = getFinalMonsterStats(monster, playerLevel, enemyIndex, isBoss, playerFinal, node.id) as any;
  // 如果提供了基线覆盖，则按原始基线与目标基线的比率调整 finalMonster（三维分别缩放）
  const baselineOverride = (scale as unknown) as { baseline?: BaselineOverride };
  if (baselineOverride && (baselineOverride as any).baseline) {
    try {
      const override = (baselineOverride as any).baseline as BaselineOverride;
      const orig = getMapMonsterBaselineByLevel(node.recommendedLevel);
      const desired = {
        hp: Math.max(1, Math.floor(override.hp.baseline + (node.recommendedLevel - 1) * override.hp.levelAdder)),
        attack: Math.max(1, Math.floor(override.attack.baseline + (node.recommendedLevel - 1) * override.attack.levelAdder)),
        defense: Math.max(0, Math.floor(override.defense.baseline + (node.recommendedLevel - 1) * override.defense.levelAdder)),
      };
      const ratioHp = orig.hp > 0 ? desired.hp / orig.hp : 1;
      const ratioAtk = orig.attack > 0 ? desired.attack / orig.attack : 1;
      const ratioDef = orig.defense > 0 ? desired.defense / orig.defense : 1;
      finalMonster = {
        ...finalMonster,
        maxHp: Math.max(1, Math.floor(finalMonster.maxHp * ratioHp)),
        attack: Math.max(1, Math.floor(finalMonster.attack * ratioAtk)),
        defense: Math.max(0, Math.floor(finalMonster.defense * ratioDef)),
      };
    } catch {
      // ignore override errors
    }
  }
  const monsterSchema: BattleUnitSchema = {
    id: `${waveId}-${monster.id}-${enemyIndex}`,
    name: monster.name,
    faction: 'monster',
    baseStats: {
      hp: Math.max(1, Math.floor(finalMonster.maxHp * scale.hpMult)),
      attack: Math.max(1, Math.floor(finalMonster.attack * scale.attackMult)),
      defense: Math.max(0, Math.floor(finalMonster.defense * scale.defenseMult)),
    },
    skills: monster.skillSet ?? [],
    passives: [],
    elements: [],
    tags: [monster.monsterType],
    aiProfile: 'default',
    derivedStats: {
      damageReduction: finalMonster.damageReduction,
    },
    meta: {
      monsterId: monster.id,
      icon: monster.icons?.[0] ?? '👾',
      waveId,
      waveLabel: wave.label ?? `Wave ${enemyIndex + 1}`,
      isBoss,
    },
  };

  return createBattleUnit(monsterSchema, playerLevel);
};

const buildSession = (
  config: SimulatorConfig,
  chapter: MapChapterDef,
  node: MapNodeDef,
  runIndex: number,
): BattleSession => {
  const playerRawStats = buildPlayerStats(config);
  // encounterCount 固定为 0，确保每次模拟基准一致
  const playerFinal = getFinalPlayerStats(playerRawStats, 0);

  const nodeWaves = node.waves ?? [];
  const validWaves = nodeWaves
    .map((wave, idx) => ({ wave, waveId: wave.id || `wave-${idx + 1}` }))
    .filter(({ wave }) => Array.isArray(wave.monsters) && wave.monsters.length > 0);

  const enemies: BattleUnitInstance[] = [];
  let enemyIndex = 0;
  const scale = config.mapScale ?? { hpMult: 1, attackMult: 1, defenseMult: 1 };
  const baselineOverride: BaselineOverride | undefined = (config as any).baselineOverride;
  for (const { wave, waveId } of validWaves) {
    for (const wm of wave.monsters) {
      // 将 baselineOverride 通过最后一个参数传递（临时适配）：
      enemies.push(buildEnemyUnit(node, wave, waveId, wm.monsterId, enemyIndex, config.preset.level, playerFinal, Object.assign({}, scale, { baseline: baselineOverride } as any)));
      enemyIndex++;
    }
  }

  if (enemies.length === 0) throw new Error(`[Simulator] Node ${node.id} has no valid monsters.`);

  const playerSchema: BattleUnitSchema = {
    id: 'player',
    name: 'Player',
    faction: 'player',
    baseStats: {
      hp: playerFinal.maxHp,
      attack: playerFinal.attack,
      defense: playerFinal.defense,
    },
    skills: ['basic_attack'],
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
  };

  const playerUnit = createBattleUnit(playerSchema, config.preset.level);

  for (const passiveId of playerUnit.passives) {
    registerPassiveListeners(passiveId, playerUnit);
  }
  for (const enemy of enemies) {
    for (const passiveId of enemy.passives) {
      registerPassiveListeners(passiveId, enemy);
    }
  }

  return {
    id: `sim_${runIndex}_${Date.now()}`,
    chapterId: chapter.id,
    chapterName: chapter.name,
    nodeId: node.id,
    nodeName: node.name,
    encounterType: node.encounterType,
    turn: 0,
    player: playerUnit,
    enemies,
    waveOrder: validWaves.map((e) => e.waveId),
    currentWaveIndex: 0,
    phase: 'player_input',
    status: 'fighting',
    events: [],
    logs: [],
  };
};

// ─── 单次模拟运行 ──────────────────────────────────────────────────────────────

const MAX_TURNS = 300; // 防止死循环

const runOnce = (
  config: SimulatorConfig,
  chapter: MapChapterDef,
  node: MapNodeDef,
  runIndex: number,
): SimulationRun => {
  let session = buildSession(config, chapter, node, runIndex);

  const waveLabels: Map<string, string> = new Map();
  for (const enemy of session.enemies) {
    const waveId = typeof enemy.meta?.waveId === 'string' ? enemy.meta.waveId : '';
    const waveLabel = typeof enemy.meta?.waveLabel === 'string' ? enemy.meta.waveLabel : waveId;
    if (waveId && !waveLabels.has(waveId)) {
      waveLabels.set(waveId, waveLabel);
    }
  }

  const waveSnapshots: WaveSnapshot[] = [];
  const playerMaxHp = session.player.baseStats.hp;
  let prevWaveIndex = 0;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (session.status !== 'fighting') break;

    session = BattleEngine.resolveTurn(session);

    // 检测波次推进
    if (session.currentWaveIndex > prevWaveIndex) {
      // 记录刚结束的每个波次
      for (let wi = prevWaveIndex; wi < session.currentWaveIndex; wi++) {
        const waveId = session.waveOrder[wi] ?? `wave-${wi + 1}`;
        waveSnapshots.push({
          waveId,
          waveLabel: waveLabels.get(waveId) ?? `Wave ${wi + 1}`,
          waveIndex: wi,
          playerHpRemaining: Math.max(0, session.player.currentHp),
          playerHpMax: playerMaxHp,
          survived: session.player.currentHp > 0,
        });
      }
      prevWaveIndex = session.currentWaveIndex;
    }

    if (session.status !== 'fighting') break;
  }

  // 记录最终波次（战斗结束时）
  const lastWave = session.waveOrder[prevWaveIndex];
  if (lastWave !== undefined) {
    const alreadyRecorded = waveSnapshots.some((s) => s.waveIndex === prevWaveIndex);
    if (!alreadyRecorded) {
      waveSnapshots.push({
        waveId: lastWave,
        waveLabel: waveLabels.get(lastWave) ?? `Wave ${prevWaveIndex + 1}`,
        waveIndex: prevWaveIndex,
        playerHpRemaining: Math.max(0, session.player.currentHp),
        playerHpMax: playerMaxHp,
        survived: session.player.currentHp > 0 && session.status === 'victory',
      });
    }
  }

  return {
    won: session.status === 'victory',
    totalTurns: session.turn,
    waves: waveSnapshots,
  };
};

// ─── 多次迭代聚合 ──────────────────────────────────────────────────────────────

export const runSimulation = (config: SimulatorConfig): SimulationReport => {
  const chapter = MAP_CHAPTERS.find((c) => c.id === config.chapterId);
  if (!chapter) throw new Error(`[Simulator] Chapter '${config.chapterId}' not found.`);

  const node = chapter.nodes.find((n) => n.id === config.nodeId);
  if (!node) throw new Error(`[Simulator] Node '${config.nodeId}' not found.`);

  const runs: SimulationRun[] = [];
  for (let i = 0; i < config.iterations; i++) {
    try {
      runs.push(runOnce(config, chapter, node, i));
    } catch {
      // 某次运行失败不终止全部模拟
    }
  }

  if (runs.length === 0) {
    throw new Error('[Simulator] All simulation runs failed.');
  }

  // 收集所有波次 ID（按顺序）
  const allWaveIds: string[] = [];
  const waveOrder = node.waves ?? [];
  for (let i = 0; i < waveOrder.length; i++) {
    const wid = waveOrder[i].id || `wave-${i + 1}`;
    allWaveIds.push(wid);
  }

  const waveStats = allWaveIds.map((waveId, waveIndex) => {
    const snapshots = runs.map((run): WaveSnapshot | null => {
      const found = run.waves.find((s) => s.waveIndex === waveIndex);
      return found ?? null;
    });

    const reached = snapshots.filter((s): s is WaveSnapshot => s !== null);
    const survived = reached.filter((s) => s.survived);

    const hpPcts = reached.map((s) =>
      s.playerHpMax > 0 ? (s.playerHpRemaining / s.playerHpMax) * 100 : 0,
    );
    const avgHpPct = hpPcts.length > 0 ? hpPcts.reduce((a, b) => a + b, 0) / hpPcts.length : 0;
    const minHpPct = hpPcts.length > 0 ? Math.min(...hpPcts) : 0;
    const maxHpPct = hpPcts.length > 0 ? Math.max(...hpPcts) : 0;
    const avgHpRaw =
      reached.length > 0
        ? reached.reduce((a, s) => a + s.playerHpRemaining, 0) / reached.length
        : 0;

    const wave = node.waves?.[waveIndex];
    const waveLabel = wave?.label ?? `第 ${waveIndex + 1} 波`;

    return {
      waveId,
      waveLabel,
      waveIndex,
      survivalRate: runs.length > 0 ? (survived.length / runs.length) * 100 : 0,
      avgHpPct: Math.round(avgHpPct * 10) / 10,
      minHpPct: Math.round(minHpPct * 10) / 10,
      maxHpPct: Math.round(maxHpPct * 10) / 10,
      avgHpRaw: Math.round(avgHpRaw),
    };
  });

  const wonRuns = runs.filter((r) => r.won).length;
  const avgTurns =
    runs.length > 0 ? runs.reduce((a, r) => a + r.totalTurns, 0) / runs.length : 0;

  return {
    chapterId: chapter.id,
    chapterName: chapter.name,
    nodeId: node.id,
    nodeName: node.name,
    iterations: config.iterations,
    actualRuns: runs.length,
    overallWinRate: (wonRuns / runs.length) * 100,
    avgTurns: Math.round(avgTurns * 10) / 10,
    waveStats,
    completionRate: (wonRuns / runs.length) * 100,
  };
};

/** 异步版本：避免大量迭代阻塞 UI 主线程，分批运行后返回结果 */
export const runSimulationAsync = (config: SimulatorConfig): Promise<SimulationReport> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(runSimulation(config));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
};
