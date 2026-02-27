
import type { BattleAction, BattleEvent, BattleSession, StatusAppliedEvent} from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import { resolveDamage } from './DamagePipeline';
import skillsJson from '@data/config/game/skills.json';
export type EffectTrigger = 'on_cast' | BattleEvent['type'];
export interface EffectContext {
  session: BattleSession;
  action: BattleAction;
  bus: BattleEventBus;
  source: BattleUnitInstance;
  targets: BattleUnitInstance[];
  event?: BattleEvent;
}

export interface EffectNode {
  id: string;
  trigger: EffectTrigger;
  execute(ctx: EffectContext): void;
}

type RawNodeDef = {
  id: string;
  trigger: EffectTrigger;
  type: string;
  params?: Record<string, any>;
};

type RawSkillDef = {
  id: string;
  name?: string;
  nodes: RawNodeDef[];
};

function buildNodeFromDef(def: RawNodeDef): EffectNode {
  const { id, trigger, type, params = {} } = def;

  if (type === 'deal_damage') {
    return {
      id,
      trigger,
      execute: ({ source, targets, bus }) => {
        for (const target of targets) {
          resolveDamage(
            {
              source,
              target,
              baseDamage: params.baseDamage ?? 0,
              critMultiplier: params.critMultiplier ?? 1,
              modifiers: params.modifiers ?? [],
            },
            bus,
          );
        }
      },
    };
  }

  if (type === 'apply_status') {
    return {
      id,
      trigger,
      execute: ({ source, targets, bus }) => {
        for (const target of targets) {
          let magnitude = params.magnitude ?? 0;
          if (params.magnitudeFactor && params.magnitudeBase === 'attack') {
            magnitude = Math.max(1, Math.floor(source.baseStats.attack * params.magnitudeFactor));
          } else if (params.magnitudeFactor && params.magnitudeBase === 'hp') {
            magnitude = Math.max(1, Math.floor(source.baseStats.hp * params.magnitudeFactor));
          }

          const event: StatusAppliedEvent = {
            type: 'status_applied',
            targetId: target.id,
            statusId: params.statusId,
            statusType: params.statusType,
            stacks: params.stacks ?? 1,
            duration: params.duration ?? 1,
            magnitude,
            element: params.element,
            sourceId: source.id,
          };
          bus.emit(event);
        }
      },
    };
  }

  // Fallback no-op node
  return {
    id,
    trigger,
    execute: () => {},
  };
}

const SKILL_DEFINITIONS: Record<string, EffectNode[]> = {};
for (const [skillId, raw] of Object.entries(skillsJson as Record<string, RawSkillDef>)) {
  SKILL_DEFINITIONS[skillId] = (raw.nodes || []).map(buildNodeFromDef);
}

export function runSkillOnCast(skillId: string, ctx: EffectContext): void {
  const nodes = SKILL_DEFINITIONS[skillId];
  if (!nodes) return;

  for (const node of nodes) {
    if (node.trigger === 'on_cast') {
      node.execute(ctx);
    }
  }
}

