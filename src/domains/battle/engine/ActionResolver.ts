import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import { resolveDamage } from './DamagePipeline';
import type { BattleEventBus } from './EventBus';
import { castSkill } from './skillsConfig';
import skillsJson from '@data/config/game/skills.json';

type SkillMeta = { energyCost?: number; cooldown?: number; displayName?: string };
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;
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
      const meta = SKILLS_META[skillId] ?? {};
      const energyCost = meta.energyCost ?? 0;
      const cooldownTurns = meta.cooldown ?? 0;
      const displayName = meta.displayName ?? skillId;

      // 冷却检查
      const remainingCd = source.skillCooldowns[skillId] ?? 0;
      if (remainingCd > 0) {
        session.logs.push(`[Battle] ${source.name} 尝试使用「${displayName}」但该技能还在冷却中 (${remainingCd}回合)。`);
        return session;
      }
      // 能量检查（仅对玩家进行）
      if (source.faction === 'player' && source.currentEnergy < energyCost) {
        session.logs.push(`[Battle] 能量不足！「${displayName}」需要 ${energyCost} 能量，当前 ${source.currentEnergy}。`);
        return session;
      }

      const skillDisplayName = meta.displayName ?? skillId;
      session.logs.push(`[Battle] Turn ${session.turn}: ${source.name} 释放「${skillDisplayName}」。`);
      const targets = action.targetIds
        .map((id) => getUnitById(session, id))
        .filter((unit): unit is BattleUnitInstance => Boolean(unit && unit.currentHp > 0));
      castSkill(skillId, source, targets, eventBus, session.listenerRegistry);

      // 技能展开后扣除能量并设置冷却
      if (source.faction === 'player') {
        source.currentEnergy = Math.max(0, source.currentEnergy - energyCost);
      }
      if (cooldownTurns > 0) {
        source.skillCooldowns[skillId] = cooldownTurns;
      }
    }

  eventBus.emit({
    type: 'after_action',
    action,
    sourceId: source.id,
  });

  return session;
};
