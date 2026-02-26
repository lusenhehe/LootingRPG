import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import { resolveDamage } from './DamagePipeline';
import type { BattleEventBus } from './EventBus';

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

    const beforeHp = target.currentHp;
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

    const dealt = Math.max(0, beforeHp - target.currentHp);
    session.logs.push(`[Battle] Turn ${session.turn}: ${source.name} dealt ${dealt} to ${target.name}.`);
    if (target.currentHp <= 0) {
      session.logs.push(`[Battle] ${target.name} defeated.`);
    }
    if (source.currentHp <= 0) {
      session.logs.push(`[Battle] ${source.name} was defeated by reflection.`);
      break;
    }
  }

  return session;
};
