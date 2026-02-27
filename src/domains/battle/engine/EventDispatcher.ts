/**
 * 战斗事件分发器
 * 核心功能是将战斗事件广播给所有符合条件的监听器，并处理一次性监听器的移除。
 *  1. 遍历当前战斗会话中的所有单位（玩家和敌人）。
 *  2. 对每个单位，检查其监听器列表，找到与当前事件类型匹配的监听器。
 *  3. 对每个匹配的监听器，执行其定义的操作，并在执行后检查是否为一次性监听器，如果是则标记为待移除。
 *  4. 在处理完所有监听器后，移除所有标记为一次性的监听器，确保它们不会在未来的事件中再次触发。
 *  5. 通过 `contextTargets` 参数支持显式传递目标单位，适用于技能施放等需要指定目标的事件。
 * 
 */
import type { BattleEvent, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import type { BattleListener, ListenerContext } from './listenerTypes';
import type { BattleListenerRegistry } from './ListenerRegistry';

/** 最大事件深度，防止无限递归链反应。 */
export const MAX_EVENT_DEPTH = 100;

/**
 * 将 `event` 广播给每个存活单位上所有与 `event.type` 匹配的监听器。
 *
 * `once` 监听器在触发后会从单位上移除。
 *
 * @param contextTargets  显式传递的目标单位（用于技能施放监听器）。
 *                        被动 / 状态监听器接收一个空数组，并从 `session` 中解析目标。
 *                        从 `session` 中解析目标。
 */
export function dispatchEvent(
  session: BattleSession,
  event: BattleEvent,
  bus: BattleEventBus,
  contextTargets: BattleUnitInstance[] = [],
  registry?: BattleListenerRegistry,
): void {
  const ctx: ListenerContext = {
    session,
    bus,
    source: session.player, // registry.dispatch 会按 ownerId 覆盖 source
    targets: contextTargets,
    event,
  };

  // ── 路径 A：注册中心（O(1) 分桶查找） ─────────────────────────────────────
  if (registry) {
    registry.dispatch(ctx);
    return;
  }

  // ── 路径 B：兜底——逐单位遍历（无 registry 时的向后兼容路径） ─────────────
  const allUnits: BattleUnitInstance[] = [session.player, ...session.enemies];

  for (const unit of allUnits) {
    if (!unit.listeners || unit.listeners.length === 0) continue;

    const matching = unit.listeners.filter(
      (l): l is BattleListener => l.trigger === event.type,
    );
    if (matching.length === 0) continue;

    const toRemove: string[] = [];
    const unitCtx: ListenerContext = { ...ctx, source: unit };

    for (const listener of matching) {
      listener.execute(unitCtx);
      if (listener.once) {
        toRemove.push(listener.id);
      }
    }

    if (toRemove.length > 0) {
      unit.listeners = unit.listeners.filter((l) => !toRemove.includes(l.id));
    }
  }
}
