import type { BattleAction, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import skillsJson from '@data/config/game/skills.json';
import type { DamageModifier, DamageBreakdown } from './DamagePipeline';
import { resolveDamage } from './DamagePipeline';
import type { BattleEventBus } from './EventBus';
import { castSkill } from './skillsConfig';
type RawNodeDef = { id: string; trigger: string; type: string; params?: Record<string, unknown> };
type RawSkillDef = {
  id: string;
  name?: string;
  displayName?: string;
  icon?: string;
  nodes: RawNodeDef[];
  targetScope?: string;
  energyCost?: number;
  cooldown?: number;
  description?: string;
};
type SkillMeta = {
  energyCost?: number;
  cooldown?: number;
  displayName?: string;
  description?: string;
  icon?: string;
  targetScope?: string;
};
const SKILLS_JSON = skillsJson as unknown as Record<string, RawSkillDef>;
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;
function buildDamageLog(
  sourceName: string,
  targetName: string,
  bd: DamageBreakdown,
  tag: string,
  turn: number,
): string {
  const penStr = bd.elementalPen > 0
    ? ` 穿透${Math.round(bd.elementalPen * 100)}%`
    : '';
  const defStr = bd.elementalPen > 0
    ? `DEF ${bd.rawDefense}→${bd.effectiveDefense}${penStr}`
    : `DEF ${bd.rawDefense}`;
  const critStr = bd.didCrit
    ? ` 暴击x${bd.critMultiplier.toFixed(2)}`
    : '';
  return `[T${turn}]${tag} ${sourceName} > ${targetName}: ATK ${bd.rawAttack}${critStr} vs ${defStr} = ${bd.finalDamage} 伤害`;
}
function buildSkillEffectDesc(skillId: string, source: BattleUnitInstance): string {
  const skill = SKILLS_JSON[skillId];
  if (!skill) return '';
  const parts: string[] = [];
  for (const node of skill.nodes) {
    if (node.type === 'deal_damage') {
      parts.push('直接伤害');
    } else if (node.type === 'apply_status') {
      const p = node.params ?? {};
      let mag = (p.magnitude as number) ?? 0;
      if (p.magnitudeFactor) {
        const factor = p.magnitudeFactor as number;
        const base = p.magnitudeBase === 'attack' ? source.baseStats.attack : source.baseStats.hp;
        mag = Math.max(1, Math.floor(base * factor));
      }
      const dur = (p.duration as number) ?? 1;
      const stype = p.statusType as string;
      if (stype === 'dot') parts.push(`中毒[${mag}/回合 x ${dur}回]`);
      else if (stype === 'shield') parts.push(`护盾[${mag}点 x ${dur}回]`);
      else if (stype === 'hot') parts.push(`回血[${mag}/回合 x ${dur}回]`);
      else if (stype === 'buff') parts.push(`增益[${dur}回]`);
      else if (stype === 'debuff') parts.push(`减益[${dur}回]`);
      else parts.push(`${stype}[${dur}回]`);
    }
  }
  return parts.join(' + ');
}
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
    const rawMult = action.payload?.damageMultiplier;
    const extraModifiers: DamageModifier[] = [];
    if (typeof rawMult === 'number' && rawMult !== 1) {
      extraModifiers.push({
        type: 'heavy_attack',
        apply: (ctx) => { ctx.baseDamage *= rawMult; },
      });
    }
    const tag = typeof rawMult === 'number' && rawMult > 1 ? '[重击]' : '[攻击]';
    for (const targetId of action.targetIds) {
      const target = getUnitById(session, targetId);
      if (!target || target.currentHp <= 0) continue;
      const breakdown: DamageBreakdown = resolveDamage(
        { source, target, baseDamage: 0, critMultiplier: 1, modifiers: extraModifiers },
        eventBus,
      );
      session.logs.push(buildDamageLog(source.name, target.name, breakdown, tag, session.turn));
    }
    if (source.faction === 'player') {
      source.currentEnergy = Math.min(source.maxEnergy ?? 100, source.currentEnergy + 25);
    }
  } else if (action.type === 'skill') {
    const skillId = typeof action.payload?.skillId === 'string' ? action.payload.skillId : undefined;
    if (skillId) {
      const meta = SKILLS_META[skillId] ?? {};
      const energyCost = meta.energyCost ?? 0;
      const cooldownTurns = meta.cooldown ?? 0;
      const displayName = meta.displayName ?? skillId;
      const targetScope = meta.targetScope ?? 'enemy';
      const remainingCd = source.skillCooldowns[skillId] ?? 0;
      if (remainingCd > 0) {
        session.logs.push(`[T${session.turn}][CD] ${source.name} 「${displayName}」冷却中 (${remainingCd}回合)`);
        return session;
      }
      if (source.faction === 'player' && source.currentEnergy < energyCost) {
        session.logs.push(`[T${session.turn}][MP] 能量不足！「${displayName}」需 ${energyCost}，当前 ${source.currentEnergy}`);
        return session;
      }
      let targets: BattleUnitInstance[];
      if (targetScope === 'self') {
        targets = [source];
      } else {
        targets = action.targetIds
          .map((id) => getUnitById(session, id))
          .filter((unit): unit is BattleUnitInstance => Boolean(unit && unit.currentHp > 0));
      }
      const effectDesc = buildSkillEffectDesc(skillId, source);
      const targetNames = targets.map((t) => t.name).join(', ') || '无目标';
      const skillIcon = meta.icon ?? '';
      session.logs.push(`[T${session.turn}]${skillIcon} ${displayName} -> ${targetNames}: ${effectDesc}`);
      castSkill(skillId, source, targets, eventBus, session.listenerRegistry);
      if (source.faction === 'player') {
        source.currentEnergy = Math.max(0, source.currentEnergy - energyCost);
      }
      if (cooldownTurns > 0) {
        source.skillCooldowns[skillId] = cooldownTurns;
      }
    }
  }
  eventBus.emit({
    type: 'after_action',
    action,
    sourceId: source.id,
  });
  return session;
};