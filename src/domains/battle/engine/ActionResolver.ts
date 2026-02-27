import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import { resolveDamage } from './DamagePipeline';
import type { BattleEventBus } from './EventBus';
import { runSkillOnCast } from './skillsConfig';
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

  eventBus.emit({
    type: 'before_action',
    action,
    sourceId: source.id,
  });

  if (action.type === 'basic_attack') {
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
  } else if (action.type === 'skill') {
    const skillId = typeof action.payload?.skillId === 'string' ? action.payload.skillId : undefined;
    if (skillId) {
      const targets = action.targetIds
        .map((id) => getUnitById(session, id))
        .filter((unit): unit is BattleUnitInstance => Boolean(unit && unit.currentHp > 0));
      runSkillOnCast(skillId, {
        session,
        action,
        bus: eventBus,
        source,
        targets,
      });
    }
  }

  eventBus.emit({
    type: 'after_action',
    action,
    sourceId: source.id,
  });

  return session;
};
