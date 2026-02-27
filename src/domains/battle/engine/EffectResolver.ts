import type {
  ApplyDamageEvent,
  ApplyHealEvent,
  BattleEvent,
  BattleSession,
  UnitDiedEvent,
  StatusAppliedEvent,
  StatusTickEvent,
  ElementReactionEvent,
} from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import {
  applyStatusFromEvent,
  handleStatusTickEvent,
  maybeEmitElementReaction,
} from './StatusSystem';

const findUnit = (session: BattleSession, unitId: string): BattleUnitInstance | undefined => {
  if (session.player.id === unitId) {
    return session.player;
  }
  return session.enemies.find((enemy) => enemy.id === unitId);
};

function handleApplyDamage(
  session: BattleSession,
  event: ApplyDamageEvent,
): UnitDiedEvent | undefined {
  const target = findUnit(session, event.targetId);
  if (!target) {
    return;
  }

  let remaining = event.amount;

  if (target.statuses && target.statuses.length > 0) {
    const shields = target.statuses.filter((s) => s.kind === 'shield');
    for (const shield of shields) {
      if (remaining <= 0) break;
      const absorb = Math.min(remaining, Math.max(0, Math.floor(shield.magnitude)));
      if (absorb <= 0) continue;
      shield.magnitude -= absorb;
      remaining -= absorb;
    }
    target.statuses = target.statuses.filter((s) => s.kind !== 'shield' || s.magnitude > 0);
  }

  if (remaining <= 0) {
    event.amount = 0;
    return;
  }

  event.amount = remaining;
  target.currentHp -= remaining;

  if (target.currentHp <= 0) {
    target.currentHp = 0;
    return {
      type: 'unit_died',
      unitId: target.id,
    };
  }

  return;
}

function handleApplyHeal(session: BattleSession, event: ApplyHealEvent): void {
  const target = findUnit(session, event.targetId);
  if (!target) {
    return;
  }

  const maxHp = target.baseStats.hp;
  target.currentHp = Math.min(maxHp, target.currentHp + event.amount);
}

function handleUnitDied(session: BattleSession, event: UnitDiedEvent): void {
  const unit = findUnit(session, event.unitId);
  if (!unit) {
    return;
  }

  unit.currentHp = 0;
  session.logs.push(`[Battle] ${unit.name} defeated.`);
}

export function resolveEffects(
  session: BattleSession,
  events: BattleEvent[],
  eventBus?: BattleEventBus,
): BattleSession {
  const pendingEvents: BattleEvent[] = [...events];

  while (pendingEvents.length > 0) {
    const event = pendingEvents.shift();
    if (!event) {
      break;
    }

    session.events.push(event);

    switch (event.type) {
      case 'apply_damage': {
        const deathEvent = handleApplyDamage(session, event);
        if (deathEvent) {
          pendingEvents.push(deathEvent);
          pendingEvents.push({
            type: 'on_kill',
            killerId: event.sourceId,
            victimId: event.targetId,
          });
        }
        if (eventBus) {
          maybeEmitElementReaction(session, event.sourceId, event.targetId, eventBus);
        }
        break;
      }
      case 'apply_heal':
        handleApplyHeal(session, event);
        break;
      case 'unit_died':
        handleUnitDied(session, event);
        break;
      case 'status_applied':
        applyStatusFromEvent(session, event as StatusAppliedEvent);
        break;
      case 'status_tick':
        if (eventBus) {
          handleStatusTickEvent(session, event as StatusTickEvent, eventBus);
        }
        break;
      case 'element_reaction':
        // element reactions already emitted secondary effects when created
        break;
      default:
        break;
    }
  }

  return session;
}
