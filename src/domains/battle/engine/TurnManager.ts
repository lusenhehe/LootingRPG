import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import { resolveAction } from './ActionResolver';
import { resolveEffects } from './EffectResolver';
import { BattleListenerRegistry } from './ListenerRegistry';

const cloneBattleUnit = (unit: BattleUnitInstance): BattleUnitInstance => ({
  ...unit,
  baseStats: { ...unit.baseStats },
  derivedStats: { ...unit.derivedStats },
  skills: [...unit.skills],
  passives: [...unit.passives],
  elements: [...unit.elements],
  tags: [...unit.tags],
  // Deep-clone statuses so magnitude/remainingTurns mutations stay isolated
  statuses: unit.statuses ? unit.statuses.map((s) => ({ ...s })) : undefined,
  // Shallow-clone listeners array; listener closures reference IDs (strings), not objects
  listeners: unit.listeners ? [...unit.listeners] : undefined,
  // Deep-clone skillCooldowns
  skillCooldowns: { ...unit.skillCooldowns },
  meta: unit.meta ? { ...unit.meta } : undefined,
});

const cloneSession = (session: BattleSession): BattleSession => ({
  ...session,
  player: cloneBattleUnit(session.player),
  enemies: session.enemies.map((enemy) => cloneBattleUnit(enemy)),
  logs: [...session.logs],
  events: [],
  // listenerRegistry 由 resolveTurn 在克隆后立即重建，不继承旧引用
  listenerRegistry: undefined,
});

const getWaveId = (unit: BattleUnitInstance, fallback: string): string => {
  const value = unit.meta?.waveId;
  return typeof value === 'string' ? value : fallback;
};

const isAlive = (unit: BattleUnitInstance): boolean => unit.currentHp > 0;

const getCurrentWaveAliveEnemies = (session: BattleSession): BattleUnitInstance[] => {
  const currentWaveId = session.waveOrder[session.currentWaveIndex];
  if (!currentWaveId) {
    return [];
  }
  return session.enemies.filter((enemy, index) => getWaveId(enemy, `wave-${index + 1}`) === currentWaveId && isAlive(enemy));
};

const updateBattleOutcome = (session: BattleSession): void => {
  const playerAlive = isAlive(session.player);
  const enemyAlive = session.enemies.some(isAlive);

  if (!playerAlive) {
    session.status = 'defeat';
    session.phase = 'finished';
    return;
  }

  if (!enemyAlive) {
    session.status = 'victory';
    session.phase = 'finished';
    return;
  }

  session.status = 'fighting';
};

const advanceWaveIfNeeded = (session: BattleSession): void => {
  while (session.currentWaveIndex < session.waveOrder.length) {
    const aliveEnemies = getCurrentWaveAliveEnemies(session);
    if (aliveEnemies.length > 0) {
      break;
    }
    session.currentWaveIndex += 1;
  }
};

export const resolveTurn = (
  session: BattleSession,
  eventBus: BattleEventBus,
  playerActionOverride?: BattleAction,
): BattleSession => {
  if (session.status !== 'fighting') {
    return session;
  }
  const nextSession = cloneSession(session);
  nextSession.turn += 1;
  nextSession.phase = 'resolving';

  // ── 构建本回合注册中心，挂载到 session 上以确保任何调用路径都可访问 ──────────
  nextSession.listenerRegistry = BattleListenerRegistry.fromSession(nextSession);

  // `on_turn_start` 事件在每个回合开始时触发，允许 DOT/HOT 和被动效果自动处理持续影响。
  eventBus.emit({ type: 'on_turn_start', turn: nextSession.turn });
  const turnStartEvents = eventBus.drainEvents();
  if (turnStartEvents.length > 0) {
    resolveEffects(nextSession, turnStartEvents, eventBus);
  }

  advanceWaveIfNeeded(nextSession);
  let aliveEnemies = getCurrentWaveAliveEnemies(nextSession);

  if (aliveEnemies.length === 0) {
    updateBattleOutcome(nextSession);
    eventBus.emit({ type: 'turn_end' });
    nextSession.events = eventBus.drainEvents();
    return nextSession;
  }

  const playerAction: BattleAction = playerActionOverride ?? {
    id: `action_${nextSession.turn}_player`,
    type: 'basic_attack',
    sourceId: nextSession.player.id,
    targetIds: [aliveEnemies[0].id],
  };

  resolveAction(nextSession, playerAction, eventBus);
  const playerActionEvents = eventBus.drainEvents();
  resolveEffects(nextSession, playerActionEvents, eventBus);

  // ── 普攻积累 25 能量（技能消耗能量后能量不会额外再增加）────────────────────
  if (playerAction.type === 'basic_attack') {
    const ENERGY_GAIN = 25;
    nextSession.player.currentEnergy = Math.min(
      nextSession.player.maxEnergy,
      nextSession.player.currentEnergy + ENERGY_GAIN,
    );
  }
  updateBattleOutcome(nextSession);
  if (nextSession.status !== 'fighting') {
    eventBus.emit({ type: 'turn_end' });
    nextSession.events.push(...eventBus.drainEvents());
    return nextSession;
  }
  advanceWaveIfNeeded(nextSession);
  aliveEnemies = getCurrentWaveAliveEnemies(nextSession);
  if (aliveEnemies.length === 0) {
    updateBattleOutcome(nextSession);
    eventBus.emit({ type: 'turn_end' });
    nextSession.events = eventBus.drainEvents();
    return nextSession;
  }

  nextSession.phase = 'enemy_turn';
  for (const enemy of aliveEnemies) {
    const enemyAction: BattleAction = {
      id: `action_${nextSession.turn}_${enemy.id}`,
      type: 'basic_attack',
      sourceId: enemy.id,
      targetIds: [nextSession.player.id],
    };

    resolveAction(nextSession, enemyAction, eventBus);
  }

  const enemyActionEvents = eventBus.drainEvents();
  resolveEffects(nextSession, enemyActionEvents, eventBus);

  advanceWaveIfNeeded(nextSession);
  updateBattleOutcome(nextSession);
  if (nextSession.status === 'fighting') {
    nextSession.phase = 'player_input';
  }

  // ── 回合结束：Tick 玩家技能冷却 ─────────────────────────────────────────────
  for (const skillId of Object.keys(nextSession.player.skillCooldowns)) {
    const cd = nextSession.player.skillCooldowns[skillId];
    if (cd > 0) {
      nextSession.player.skillCooldowns[skillId] = cd - 1;
    }
  }

  // ── 为下回合存活敌人生成意图预告 ─────────────────────────────────────────────
  const nextWaveEnemies = getCurrentWaveAliveEnemies(nextSession);
  for (const enemy of nextWaveEnemies) {
    const atkEst = Math.floor(enemy.baseStats.attack);
    const roll = Math.random();
    if (roll < 0.18) {
      enemy.nextIntent = {
        type: 'heavy_attack',
        label: '💥 蓄力重击',
        estimatedDamage: Math.floor(atkEst * 1.8),
      };
    } else if (roll < 0.30) {
      enemy.nextIntent = {
        type: 'defend',
        label: '🛡️ 防御姿态',
      };
    } else {
      enemy.nextIntent = {
        type: 'attack',
        label: '⚔️ 普通攻击',
        estimatedDamage: atkEst,
      };
    }
  }

  eventBus.emit({ type: 'turn_end' });
  nextSession.events.push(...eventBus.drainEvents());
  return nextSession;
};
