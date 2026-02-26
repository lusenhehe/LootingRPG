import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import { resolveDamage } from './DamagePipeline';
import type { BattleEventBus } from './EventBus';
const isApplyDamageEvent = (
  event: BattleSession['events'][number],
): event is Extract<BattleSession['events'][number], { type: 'apply_damage' }> => event.type === 'apply_damage';

const getUnitById = (session: BattleSession, unitId: string): BattleUnitInstance | undefined => {
  if (session.player.id === unitId) {
    return session.player;
  }
  return session.enemies.find((enemy) => enemy.id === unitId);
};

export const resolveAction = (
  session: BattleSession,
  action: BattleAction,
  eventBus: BattleEventBus,
): BattleSession => {
  const source = getUnitById(session, action.sourceId);
  if (!source || source.currentHp <= 0) {
    return session;
  }

  if (action.type !== 'basic_attack') {
    return session;
  }

  for (const targetId of action.targetIds) {
    const target = getUnitById(session, targetId);
    if (!target || target.currentHp <= 0) {
      continue;
    }

    const eventCountBefore = eventBus.getEvents().length;
    resolveDamage(
      {
        source,
        target,
        baseDamage: 0,
        critMultiplier: 1,
        modifiers: [],
      },
      eventBus,
    );

    const latestEvents = eventBus.getEvents().slice(eventCountBefore);
    const dealt = latestEvents
      .filter(isApplyDamageEvent)
      .filter((event) => event.sourceId === source.id && event.targetId === target.id)
      .reduce((total, event) => total + event.amount, 0);
    session.logs.push(`[Battle] Turn ${session.turn}: ${source.name} dealt ${dealt} to ${target.name}.`);
  }

  return session;
};
