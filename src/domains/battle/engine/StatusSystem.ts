/**
 * StatusSystem —  状态效果应用和管理
 * 当新的状态被应用时，此模块会在目标单位上注册一个 `on_turn_start` 监听器。
 * 监听器处理 DOT/HOT 的每回合触发，并在状态过期时自动移除自身。
  * 这种设计将状态效果的持续影响与战斗事件系统无缝集成，允许复杂的交互和组合。
 */
import type { StatusAppliedEvent, BattleSession} from '../../../shared/types/game';
import type { BattleUnitInstance, BattleStatusInstance, BattleListenerDef} from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import type { ListenerContext } from './listenerTypes';
import elementReactionsJson from '@data/config/game/elementReactions.json';

// ─── Element Reaction Config (data-driven) ────────────────────────────────────

type ElementReactionDef = {
  // 元素反应触发条件 — 例如 ["pyro", "hydro"] 表示任意组合的火和水都会触发
  conditions: string[];
  reaction: string;
  extraDamageFactor: number;
};

const ELEMENT_REACTIONS: Record<string, ElementReactionDef> =
  elementReactionsJson as Record<string, ElementReactionDef>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findUnit = (session: BattleSession, unitId: string): BattleUnitInstance | undefined => {
  if (session.player.id === unitId) return session.player;
  return session.enemies.find((e) => e.id === unitId);
};

/** 生成状态效果的唯一监听器 ID */
const tickListenerId = (unitId: string, statusId: string): string =>
  `tick:${unitId}:${statusId}`;

// ─── Status-tick listener factory ─────────────────────────────────────────────

/**
 * 为 DOT 或 HOT 状态创建一个 `on_turn_start` 监听器。
 * 监听器的 `once` 属性为 `false` — 每回合递减 `remainingTurns`
 * 并在状态过期时移除自身（以及状态）。
 */
function createStatusTickListener(
  unit: BattleUnitInstance,
  status: BattleStatusInstance,
): BattleListenerDef {
  const listenerId = tickListenerId(unit.id, status.id);

  return {
    id: listenerId,
    ownerId: unit.id,
    trigger: 'on_turn_start',
    once: false,
    execute: (rawCtx: unknown) => {
      const { session, bus } = rawCtx as ListenerContext;
      const target = findUnit(session, unit.id);
      if (!target) return;

      const liveStatus = (target.statuses ?? []).find((s) => s.id === status.id);
      if (!liveStatus) {
        // Status was removed externally — clean up the listener
        target.listeners = target.listeners?.filter((l) => l.id !== listenerId);
        return;
      }

      // Apply tick effect
      if (liveStatus.kind === 'dot') {
        const amount = Math.max(1, Math.floor(liveStatus.magnitude * liveStatus.stacks));
        (bus as BattleEventBus).emit({
          type: 'apply_damage',
          sourceId: liveStatus.sourceId ?? target.id,
          targetId: target.id,
          amount,
        });
      } else if (liveStatus.kind === 'hot') {
        const amount = Math.max(1, Math.floor(liveStatus.magnitude * liveStatus.stacks));
        (bus as BattleEventBus).emit({
          type: 'apply_heal',
          sourceId: liveStatus.sourceId ?? target.id,
          targetId: target.id,
          amount,
        });
      }

      // Countdown — remove when expired
      liveStatus.remainingTurns -= 1;
      if (liveStatus.remainingTurns <= 0) {
        target.statuses = target.statuses?.filter((s) => s !== liveStatus);
        target.listeners = target.listeners?.filter((l) => l.id !== listenerId);
        (bus as BattleEventBus).emit({
          type: 'status_expired',
          targetId: target.id,
          statusId: liveStatus.id,
        });
      }
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * 将状态应用于单位，对于 DOT/HOT 状态，会注册一个
 * 回合开始监听器，以便事件循环自动处理状态的每回合触发。
 */
export const applyStatusFromEvent = (
  session: BattleSession,
  event: StatusAppliedEvent,
): void => {
  const target = findUnit(session, event.targetId);
  if (!target) return;

  const list: BattleStatusInstance[] = target.statuses ?? [];
  const existing = list.find((s) => s.id === event.statusId);

  if (existing) {
    // 已存在的状态 — 刷新持续时间、叠加层数，并更新数值（如果有的话）
    existing.stacks += event.stacks;
    existing.remainingTurns = Math.max(existing.remainingTurns, event.duration);
    existing.magnitude = event.magnitude;
  } else {
    const newStatus: BattleStatusInstance = {
      id: event.statusId,
      kind: event.statusType,
      sourceId: event.sourceId,
      element: event.element,
      stacks: event.stacks,
      remainingTurns: event.duration,
      magnitude: event.magnitude,
    };
    list.push(newStatus);

    //  对于 DOT/HOT 状态，注册一个回合开始监听器来处理每回合触发和过期逻辑
    if (newStatus.kind === 'dot' || newStatus.kind === 'hot') {
      const listener = createStatusTickListener(target, newStatus);
      target.listeners = [...(target.listeners ?? []), listener];
    }
  }

  target.statuses = list;
};

/**
 * 数据驱动的元素反应检查。
 * 在 `apply_damage` 解析后调用，以检测元素组合。
 */
export const maybeEmitElementReaction = (
  session: BattleSession,
  sourceId: string,
  targetId: string,
  bus: BattleEventBus,
): void => {
  const target = findUnit(session, targetId);
  const source = findUnit(session, sourceId);
  if (!target || !source) return;

  const unitElements = (u: BattleUnitInstance): string[] => [
    ...u.elements,
    ...(u.statuses ?? []).flatMap((s) =>
      s.element ? [s.element] : s.id.split('_').slice(0, 1),
    ),
  ];

  const sourceElems = new Set(unitElements(source));
  const targetElems = new Set(unitElements(target));

  for (const [, def] of Object.entries(ELEMENT_REACTIONS)) {
    const [condA, condB] = def.conditions;
    const conditionsMet =
      (sourceElems.has(condA) && targetElems.has(condB)) ||
      (sourceElems.has(condB) && targetElems.has(condA)) ||
      (targetElems.has(condA) && targetElems.has(condB));

    if (conditionsMet) {
      bus.emit({
        type: 'element_reaction',
        reaction: def.reaction,
        sourceId,
        targetId,
      });
      const extra = Math.floor((target.baseStats.hp || 1) * def.extraDamageFactor);
      bus.emit({
        type: 'apply_damage',
        sourceId,
        targetId,
        amount: Math.max(1, extra),
      });
      // 只触发第一个匹配的反应 — 避免多重反应链
      break;
    }
  }
};

