import type {
  BattleEvent,
  StatusAppliedEvent,
  StatusTickEvent,
} from '../../../shared/types/game';
import type { BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance, BattleStatusInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';

const findUnit = (session: BattleSession, unitId: string): BattleUnitInstance | undefined => {
  if (session.player.id === unitId) return session.player;
  return session.enemies.find((e) => e.id === unitId);
};

export const applyStatusFromEvent = (session: BattleSession, event: StatusAppliedEvent): void => {
  const target = findUnit(session, event.targetId);
  if (!target) return;

  const list: BattleStatusInstance[] = target.statuses ?? [];
  const existing = list.find((s) => s.id === event.statusId);
  if (existing) {
    existing.stacks += event.stacks;
    existing.remainingTurns = Math.max(existing.remainingTurns, event.duration);
    existing.magnitude = event.magnitude;
  } else {
    list.push({
      id: event.statusId,
      kind: event.statusType,
      sourceId: event.sourceId,
      element: event.element,
      stacks: event.stacks,
      remainingTurns: event.duration,
      magnitude: event.magnitude,
    });
  }
  target.statuses = list;
};

export const handleStatusTickEvent = (
  session: BattleSession,
  event: StatusTickEvent,
  bus: BattleEventBus,
): void => {
  const target = findUnit(session, event.targetId);
  if (!target || !target.statuses?.length) return;

  const status = target.statuses.find((s) => s.id === event.statusId);
  if (!status) return;

  if (status.kind === 'dot') {
    const amount = Math.max(1, Math.floor(status.magnitude * status.stacks));
    bus.emit({
      type: 'apply_damage',
      sourceId: status.sourceId ?? target.id,
      targetId: target.id,
      amount,
    });
  } else if (status.kind === 'hot') {
    const amount = Math.max(1, Math.floor(status.magnitude * status.stacks));
    bus.emit({
      type: 'apply_heal',
      sourceId: status.sourceId ?? target.id,
      targetId: target.id,
      amount,
    });
  }

  status.remainingTurns -= 1;
  if (status.remainingTurns <= 0) {
    target.statuses = target.statuses.filter((s) => s !== status);
  }
};

export const emitTurnStartStatusTicks = (session: BattleSession, bus: BattleEventBus): void => {
  const units: BattleUnitInstance[] = [session.player, ...session.enemies];
  for (const unit of units) {
    if (!unit.statuses) continue;
    for (const status of unit.statuses) {
      bus.emit({
        type: 'status_tick',
        targetId: unit.id,
        statusId: status.id,
      });
    }
  }
};

export const maybeEmitElementReaction = (
  session: BattleSession,
  sourceId: string,
  targetId: string,
  bus: BattleEventBus,
): void => {
  const target = findUnit(session, targetId);
  const source = findUnit(session, sourceId);
  if (!target || !source) return;

  const hasFire = source.elements.includes('fire') || target.elements.includes('fire');
  const hasPoisonStatus = (target.statuses ?? []).some(
    (s) => s.kind === 'dot' && (s.element === 'poison' || s.id.includes('poison')),
  );

  if (hasFire && hasPoisonStatus) {
    bus.emit({
      type: 'element_reaction',
      reaction: 'fire_poison_explosion',
      sourceId,
      targetId,
    });
    const extra = Math.floor((target.baseStats.hp || 1) * 0.05);
    bus.emit({
      type: 'apply_damage',
      sourceId,
      targetId,
      amount: Math.max(1, extra),
    });
  }
};

