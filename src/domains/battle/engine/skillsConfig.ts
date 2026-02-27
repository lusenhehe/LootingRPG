/**
 * skillsConfig — 技能定义和构建器
 *
 * 每个技能定义都从 skills.json 加载。
 * 节点会成为临时的 BattleListener 并注册到施法者单位上。
 * 当触发 `on_cast` 事件时，匹配的 once-listeners 会执行
 * 并由 EventDispatcher 自动移除。
 *
 * 添加新节点类型：将其添加到下面的 NODE_REGISTRY 中 — 无需更改其他文件。
 */
import type {
  BattleEvent,
  CastEvent,
  StatusAppliedEvent,
} from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import type { BattleListener, ListenerContext } from './listenerTypes';
import { resolveDamage } from './DamagePipeline';
import skillsJson from '@data/config/game/skills.json';

// ─── Raw JSON schema ─────────────────────────────────────────────────────────

type RawNodeDef = {
  id: string;
  /** 触发此节点的事件类型 */
  trigger: BattleEvent['type'];
  type: string;
  params?: Record<string, unknown>;
};

type RawSkillDef = {
  id: string;
  name?: string;
  nodes: RawNodeDef[];
};

// ─── Node Factory Registry ────────────────────────────────────────────────────

/**
 * 节点工厂函数（NodeFactory）根据原始节点定义返回一个完整类型的 BattleListener。
 * `targets` 在施法时捕获，以便监听器知道要影响哪些单位。
 */
type NodeFactory = (
  def: RawNodeDef,
  ownerId: string,
  targets: BattleUnitInstance[],
) => BattleListener;

const NODE_REGISTRY: Record<string, NodeFactory> = {
  deal_damage: (def, ownerId, targets): BattleListener => ({
    id: def.id,
    ownerId,
    trigger: def.trigger,
    once: true,
    execute: ({ source, bus }: ListenerContext) => {
      const params = def.params ?? {};
      for (const target of targets.filter((t) => t.currentHp > 0)) {
        resolveDamage(
          {
            source,
            target,
            baseDamage: (params.baseDamage as number) ?? 0,
            critMultiplier: (params.critMultiplier as number) ?? 1,
            modifiers: (params.modifiers as []) ?? [],
          },
          bus,
        );
      }
    },
  }),

  apply_status: (def, ownerId, targets): BattleListener => ({
    id: def.id,
    ownerId,
    trigger: def.trigger,
    once: true,
    execute: ({ source, bus }: ListenerContext) => {
      const params = def.params ?? {};
      for (const target of targets.filter((t) => t.currentHp > 0)) {
        let magnitude = (params.magnitude as number) ?? 0;
        if (params.magnitudeFactor) {
          const factor = params.magnitudeFactor as number;
          if (params.magnitudeBase === 'attack') {
            magnitude = Math.max(1, Math.floor(source.baseStats.attack * factor));
          } else if (params.magnitudeBase === 'hp') {
            magnitude = Math.max(1, Math.floor(source.baseStats.hp * factor));
          }
        }

        const statusEvent: StatusAppliedEvent = {
          type: 'status_applied',
          targetId: target.id,
          statusId: params.statusId as string,
          statusType: params.statusType as StatusAppliedEvent['statusType'],
          stacks: (params.stacks as number) ?? 1,
          duration: (params.duration as number) ?? 1,
          magnitude,
          element: params.element as string | undefined,
          sourceId: source.id,
        };
        bus.emit(statusEvent);
      }
    },
  }),
};

/** Fallback no-op listener for unsupported 节点类型 */
function createFallbackListener(def: RawNodeDef, ownerId: string): BattleListener {
  return {
    id: def.id,
    ownerId,
    trigger: def.trigger,
    once: true,
    execute: () => {},
  };
}

function buildListenerFromDef(
  def: RawNodeDef,
  ownerId: string,
  targets: BattleUnitInstance[],
): BattleListener {
  const factory = NODE_REGISTRY[def.type];
  return factory ? factory(def, ownerId, targets) : createFallbackListener(def, ownerId);
}

// ─── Loaded skill definitions ─────────────────────────────────────────────────

const SKILL_DEFINITIONS: Record<string, RawSkillDef> = skillsJson as Record<string, RawSkillDef>;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * 以监听器模式施放技能：
 *  1. 为技能定义中的每个节点构建一个 BattleListener（所有 `once: true`）。
 *  2. 将它们直接注册到施法者单位的 `listeners` 数组中。
 *  3. 触发 `on_cast` 事件 — EventDispatcher 将执行并移除它们。
 *
 * ##这取代了旧的 `runSkillOnCast` 直接调用方式。
 */
export function castSkill(
  skillId: string,
  source: BattleUnitInstance,
  targets: BattleUnitInstance[],
  bus: BattleEventBus,
): void {
  const raw = SKILL_DEFINITIONS[skillId];
  if (!raw) return;

  const listeners = raw.nodes.map((node) =>
    buildListenerFromDef(node, source.id, targets),
  );

  source.listeners = [...(source.listeners ?? []), ...listeners];

  const castEvent: CastEvent = {
    type: 'on_cast',
    sourceId: source.id,
    skillId,
  };
  bus.emit(castEvent);
}

/**
 * 注册被动技能的监听器（即非 `on_cast` 节点）。
 * 被动技能在战斗开始时注册，并持续存在于单位上。
 *  技能定义中的每个非 `on_cast` 节点都会转换为一个 BattleListener 并注册到单位上。
 *  这些监听器根据其定义的触发事件类型（例如，`on_turn_start`、`on_attacked` 等）在战斗过程中自动响应相关事件。
 *  被动技能的监听器不会在注册后自动移除，除非通过其他技能或效果显式移除它们。
 *  这种设计允许被动技能持续影响战斗状态，并与其他技能和效果进行复杂的交互。
 * @param skillId 被动技能的 ID
 * @param unit 注册监听器的单位实例
 */
export function registerPassiveListeners(
  skillId: string,
  unit: BattleUnitInstance,
): void {
  const raw = SKILL_DEFINITIONS[skillId];
  if (!raw) return;

  const passiveListeners = raw.nodes
    .filter((node) => node.trigger !== 'on_cast')
    .map((node) => buildListenerFromDef(node, unit.id, []));

  unit.listeners = [...(unit.listeners ?? []), ...passiveListeners];
}
export type { ListenerContext };

