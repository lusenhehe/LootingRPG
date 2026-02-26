import type {
  ApplyDamageEvent,
  ApplyHealEvent,
  BattleEvent,
  BattleSession,
  UnitDiedEvent,
} from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';

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

  target.currentHp -= event.amount;

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
        }
        break;
      }
      case 'apply_heal':
        handleApplyHeal(session, event);
        break;
      case 'unit_died':
        handleUnitDied(session, event);
        break;
      default:
        break;
    }
  }

  return session;
}
