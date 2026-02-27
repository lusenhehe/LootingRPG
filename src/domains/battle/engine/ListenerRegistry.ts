/**
 * BattleListenerRegistry — Phase 3.d 集中式监听器注册中心
 *
 * 设计目标：
 *  - 按触发类型分桶存储，dispatch 时 O(1) 查找（取代原来 O(n×m) 全单位遍历）
 *  - 统一监听器来源分层入口：技能 / 被动 / 状态 / 装备 / 套装 / 宠物 / 天赋
 *  - `once` 监听器执行后自动从 registry 和 unit.listeners 双向同步移除
 *  - `fromSession()` 在每个 resolveTurn 开始时快照单位监听器，构建本回合注册表
 *
 * 监听器来源层级（当前已接入）：
 *   ✔ 技能（castSkill 热注册）
 *   ✔ 被动（session 初始化注册）
 *   ✔ 状态效果（通过 unit.listeners 存储后 fromSession 读取）
 * 规划中：
 *   ☐ 装备监听器
 *   ☐ 套装效果
 *   ☐ 宠物 / 天赋
 */
import type { BattleSession } from '../../../shared/types/game';
import type { BattleListenerDef, BattleUnitInstance, IListenerRegistry } from '../../../types/battle/BattleUnit';
import type { BattleListener, ListenerContext } from './listenerTypes';

// ─── Helper ───────────────────────────────────────────────────────────────────

function findUnit(session: BattleSession, unitId: string): BattleUnitInstance | undefined {
  if (session.player.id === unitId) return session.player;
  return session.enemies.find((e) => e.id === unitId);
}

// ─── Registry Class ───────────────────────────────────────────────────────────

export class BattleListenerRegistry implements IListenerRegistry {
  /** trigger → 对应监听器列表（O(1) 查找） */
  private readonly byTrigger: Map<string, BattleListener[]> = new Map();
  /** listenerId → 监听器（O(1) unregister） */
  private readonly byId: Map<string, BattleListener> = new Map();

  // ── 注册 / 注销 ─────────────────────────────────────────────────────────────

  /**
   * 注册一个监听器。重复注册（相同 id）会被忽略（幂等）。
   * 接受 BattleListenerDef（公共类型）内底按 BattleListener 处理。
   */
  register(listener: BattleListenerDef): void {
    const l = listener as unknown as BattleListener;
    if (this.byId.has(l.id)) return;
    this.byId.set(l.id, l);
    const bucket = this.byTrigger.get(l.trigger) ?? [];
    bucket.push(l);
    this.byTrigger.set(l.trigger, bucket);
  }

  /**
   * 按 id 注销监听器，从 byId 和 byTrigger 中同时移除。
   */
  unregister(listenerId: string): void {
    const listener = this.byId.get(listenerId);
    if (!listener) return;
    this.byId.delete(listenerId);
    const bucket = this.byTrigger.get(listener.trigger);
    if (!bucket) return;
    const next = bucket.filter((l) => l.id !== listenerId);
    if (next.length > 0) {
      this.byTrigger.set(listener.trigger, next);
    } else {
      this.byTrigger.delete(listener.trigger);
    }
  }

  has(listenerId: string): boolean {
    return this.byId.has(listenerId);
  }

  // ── 分发 ─────────────────────────────────────────────────────────────────────

  /**
   * 将 `ctx.event` 广播给所有匹配触发类型的监听器。
   *
   * 接受 `unknown` 以满足 IListenerRegistry 接口；内部强转为 ListenerContext。
   *
   * 行为：
   *  1. 按 trigger 在 O(1) 取出匹配监听器快照
   *  2. 按 priority 降序排序（数字越大越先执行；相同则保持注册顺序）
   *  3. 对每个监听器，从 session 中解析 ownerUnit，覆盖 source 后执行 execute()
   *  4. `once` 监听器执行后从 registry 和 unit.listeners 双向移除
   */
  dispatch(ctx: unknown): void {
    const lctx = ctx as ListenerContext;
    if (!lctx.event) return;
    const trigger = lctx.event.type;
    const raw = this.byTrigger.get(trigger);
    if (!raw || raw.length === 0) return;

    // 快照 + 按 priority 降序排序（高优先级先触发）
    const matching = [...raw].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const onceCandidates: BattleListener[] = [];

    for (const listener of matching) {
      const ownerUnit = findUnit(lctx.session, listener.ownerId);
      if (!ownerUnit) continue;
      listener.execute({ ...lctx, source: ownerUnit });
      if (listener.once) {
        onceCandidates.push(listener);
      }
    }

    // 双向同步移除 once 监听器
    for (const listener of onceCandidates) {
      this.unregister(listener.id);
      const unit = findUnit(lctx.session, listener.ownerId);
      if (unit?.listeners) {
        unit.listeners = unit.listeners.filter((l) => l.id !== listener.id);
      }
    }
  }

  // ── 工厂方法 ──────────────────────────────────────────────────────────────────

  /**
   * 从 BattleSession 当前所有单位的 listeners 快照构建注册中心。
   * 在每个 resolveTurn 开始时调用一次，后续热注册（castSkill）继续追加。
   */
  static fromSession(session: BattleSession): BattleListenerRegistry {
    const reg = new BattleListenerRegistry();
    const allUnits: BattleUnitInstance[] = [session.player, ...session.enemies];
    for (const unit of allUnits) {
      for (const raw of unit.listeners ?? []) {
        reg.register(raw);
      }
    }
    return reg;
  }
}
