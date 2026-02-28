/**
 * runSimulation.ts
 * 战斗模拟器核心服务 — 纯 TypeScript，无 React 依赖。
 *
 * 输入：SimulationContext（唯一入口，通过 buildSimulationContext() 生成）
 * 流程：
 *   1. buildPlayerStats(context.player)                       → 玩家战斗属性
 *   2. buildEnemyUnit(node, mapScale, baselineOverride)       → 敌方单元列表
 *   3. 循环 iterations 次，每次调用 BattleEngine.resolveTurn()
 *
 * 架构原则（见 docs/simulation-order.md）：
 *   ✔ 成长公式唯一来源：calcDisplayStats（domains/player/model/playerGrowth）
 *   ✔ baselineOverride 显式传参，禁止 Object.assign 注入
 *   ✔ BattleEngine 不感知 override 存在，保持下层纯净
 */
import type { BattleSession, PlayerStats } from '../../../shared/types/game';
import type { BattleUnitInstance, BattleUnitSchema } from '../../../types/battle/BattleUnit';
import type { MapNodeDef, NodeWave, MapChapterDef } from '../../map/model/chapters';
import type { SimulationRun, WaveSnapshot, SimulationReport, BaselineOverride } from '../model/types';
import type { SimulationContext, SimulationMapScale } from '../model/simulationContext';
import type { FinalMonsterCombatStats } from '../../battle/services/monsterStats';
import { calcDisplayStats } from '../../player/model/playerGrowth';
import { getFinalPlayerStats } from '../../player/model/combat';
import { getFinalMonsterStats } from '../../battle/services/monsterStats';
import { getMonsterById } from '../../monster/config';
import { getMapMonsterBaselineByLevel } from '../../battle/services/monsterScaling';
import { createBattleUnit } from '../../battle/UnitFactory';
import { registerPassiveListeners } from '../../battle/engine/skillsConfig';
import { BattleEngine } from '../../battle/engine/BattleEngine';
import { MAP_CHAPTERS } from '../../map/model/chapters';

// ─── 内部：构建玩家 PlayerStats ────────────────────────────────────────────────

/**
 * 从 SimulationContext.player 构建 PlayerStats。
 *
 * 成长公式唯一来源：calcDisplayStats（domains/player/model/playerGrowth）。
 * statsOverride 中的字段优先于公式计算值（显式覆盖）。
 */
const buildPlayerStats = (context: SimulationContext): PlayerStats => {
  const { level, statsOverride } = context.player;
  const stats = calcDisplayStats(level, statsOverride);

  return {
    level,
    xp: 0,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    critRate: String(stats.critRate),
    damageBonus: 0,
    lifesteal: stats.lifesteal,
    thorns: stats.thorns,
    elemental: stats.elemental,
    attackSpeed: stats.attackSpeed,
    gold: 0,
  };
};

// ─── 内部：构建单个敌方单元 ─────────────────────────────────────────────────────

/**
 * 构建单个敌方 BattleUnitInstance。
 *
 * 覆盖优先级（见 docs/simulation-order.md）：
 *   1. Monster Base Stats（怪物配置文件）
 *   2. baselineOverride → 若存在，按与原始基线的比率调整三维
 *   3. mapScale（最终乘算，最低优先级）
 *
 * BattleEngine 不感知 baselineOverride 的存在，所有覆盖在此层完成。
 */
const buildEnemyUnit = (
  node: MapNodeDef,
  wave: NodeWave,
  waveId: string,
  monsterId: string,
  enemyIndex: number,
  playerLevel: number,
  playerFinal: ReturnType<typeof getFinalPlayerStats>,
  mapScale: SimulationMapScale,
  baselineOverride: BaselineOverride | undefined,
): BattleUnitInstance => {
  const monster = getMonsterById(monsterId);
  if (!monster) throw new Error(`[Simulator] Monster '${monsterId}' not found.`);

  const isBoss = node.encounterType === 'boss' || monster.monsterType === 'boss';
  let finalMonster: FinalMonsterCombatStats = getFinalMonsterStats(
    monster, playerLevel, enemyIndex, isBoss, playerFinal, node.id,
  );
  // ── 覆盖优先级 2：基线覆盖（显式传参，不再通过 Object.assign 注入） ──────────
  if (baselineOverride) {
    try {
      const orig = getMapMonsterBaselineByLevel(node.recommendedLevel);
      const desired = {
        hp: Math.max(1, Math.floor(
          baselineOverride.hp.baseline + (node.recommendedLevel - 1) * baselineOverride.hp.levelAdder,
        )),
        attack: Math.max(1, Math.floor(
          baselineOverride.attack.baseline + (node.recommendedLevel - 1) * baselineOverride.attack.levelAdder,
        )),
        defense: Math.max(0, Math.floor(
          baselineOverride.defense.baseline + (node.recommendedLevel - 1) * baselineOverride.defense.levelAdder,
        )),
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
      // baseline override 计算失败时降级使用原始值
    }
  }

  // ── 覆盖优先级 3：地图数值倍率（最终乘算） ────────────────────────────────────
  const monsterSchema: BattleUnitSchema = {
    id: `${waveId}-${monster.id}-${enemyIndex}`,
    name: monster.name,
    faction: 'monster',
    baseStats: {
      hp: Math.max(1, Math.floor(finalMonster.maxHp * mapScale.hpMultiplier)),
      attack: Math.max(1, Math.floor(finalMonster.attack * mapScale.attackMultiplier)),
      defense: Math.max(0, Math.floor(finalMonster.defense * mapScale.defenseMultiplier)),
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
      icon: monster.icons?.[0] ?? '👾',
      waveId,
      waveLabel: wave.label ?? `Wave ${enemyIndex + 1}`,
      isBoss,
    },
  };

  return createBattleUnit(monsterSchema, playerLevel);
};

// ─── 内部：构建完整 BattleSession ─────────────────────────────────────────────

const buildSession = (
  context: SimulationContext,
  chapter: MapChapterDef,
  node: MapNodeDef,
  runIndex: number,
): BattleSession => {
  const playerRawStats = buildPlayerStats(context);
  // encounterCount 固定为 0，确保每次模拟基准一致
  const playerFinal = getFinalPlayerStats(playerRawStats, 0);

  const nodeWaves = node.waves ?? [];
  const validWaves = nodeWaves
    .map((wave, idx) => ({ wave, waveId: wave.id || `wave-${idx + 1}` }))
    .filter(({ wave }) => Array.isArray(wave.monsters) && wave.monsters.length > 0);

  const enemies: BattleUnitInstance[] = [];
  let enemyIndex = 0;

  for (const { wave, waveId } of validWaves) {
    for (const wm of wave.monsters) {
      enemies.push(buildEnemyUnit(
        node, wave, waveId, wm.monsterId, enemyIndex,
        context.player.level, playerFinal,
        context.mapScale,             // 显式传 mapScale
        context.baselineOverride,     // 显式传 baselineOverride（不再 Object.assign 偷塞）
      ));
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

  const playerUnit = createBattleUnit(playerSchema, context.player.level);

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
  context: SimulationContext,
  chapter: MapChapterDef,
  node: MapNodeDef,
  runIndex: number,
): SimulationRun => {
  let session = buildSession(context, chapter, node, runIndex);

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

/**
 * 运行完整模拟并返回聚合报告。
 *
 * @param context - 由 buildSimulationContext(draft) 生成的唯一输入
 */
export const runSimulation = (context: SimulationContext): SimulationReport => {
  if (!context || !context.player) {
    throw new Error('[Simulator] invalid SimulationContext: missing player configuration');
  }
  if (typeof context.player.level !== 'number' || context.player.level <= 0) {
    throw new Error('[Simulator] invalid SimulationContext: player.level must be a positive number');
  }
  const chapter = MAP_CHAPTERS.find((c) => c.id === context.chapterId);
  if (!chapter) throw new Error(`[Simulator] Chapter '${context.chapterId}' not found.`);

  const node = chapter.nodes.find((n) => n.id === context.nodeId);
  if (!node) throw new Error(`[Simulator] Node '${context.nodeId}' not found.`);

  const runs: SimulationRun[] = [];
  const runErrors: string[] = [];
  for (let i = 0; i < context.iterations; i++) {
    try {
      runs.push(runOnce(context, chapter, node, i));
    } catch (err) {
      // 收集错误但继续尝试后续运行
      try {
        const msg = err instanceof Error ? err.message : String(err);
        runErrors.push(`run ${i}: ${msg}`);
        // 同时在控制台打印完整错误对象，便于本地调试
        // eslint-disable-next-line no-console
        console.error(`[Simulator] runOnce failed (run ${i}):`, err);
      } catch {
        // ignore
      }
    }
  }

  if (runs.length === 0) {
    const sample = runErrors.length > 0 ? runErrors[0] : 'unknown error';
    throw new Error(`[Simulator] All simulation runs failed. Sample error: ${sample}`);
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
    iterations: context.iterations,
    actualRuns: runs.length,
    overallWinRate: (wonRuns / runs.length) * 100,
    avgTurns: Math.round(avgTurns * 10) / 10,
    waveStats,
    completionRate: (wonRuns / runs.length) * 100,
  };
};

/**
 * 异步版本：避免大量迭代阻塞 UI 主线程，分批运行后返回结果。
 *
 * @param context - 由 buildSimulationContext(draft) 生成的唯一输入
 */
export const runSimulationAsync = (context: SimulationContext): Promise<SimulationReport> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(runSimulation(context));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
