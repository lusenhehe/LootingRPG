/**
 * BattleListener 定义了战斗系统中监听器的结构和行为。
 * 每个监听器都绑定一个触发事件类型，并在事件发生时执行特定的逻辑。
 * 监听器可以是一次性的（`once`），在触发后会自动移除。
 * 
 *  1. `ListenerContext` 提供了执行监听器时的上下文信息，包括当前战斗会话、事件总线、触发源单位、预解析的目标单位以及触发事件本身。
 *  2. `BattleListener` 定义了监听器的基本结构，包括唯一标识符、所属单位ID、触发事件类型、是否一次性以及执行函数。
 *  3. 监听器的执行函数接受一个 `ListenerContext` 参数，允许访问战斗状态、事件总线以及相关单位信息，以便实现复杂的战斗逻辑。
 * 
 *
*/
import type { BattleEvent, BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';

/** 完整的监听器上下文 */
export interface ListenerContext {
  session: BattleSession;
  bus: BattleEventBus;
  /** 拥有此监听器的单位 */
  source: BattleUnitInstance;
  /** 预解析的目标单位（由技能施放者设置；被动/状态监听器为空） */
  targets: BattleUnitInstance[];
  /** 触发此监听器的事件 */
  event?: BattleEvent;
}

/**
 * 完整类型的战斗监听器。
 * 存储在单位上作为 `BattleListenerDef`（不透明）以避免循环依赖；
 * 在引擎内部将其向下转换为此接口。
 */
export interface BattleListener {
  id: string;
  ownerId: string;
  /** 匹配 BattleEvent['type'] */
  trigger: BattleEvent['type'];
  /** 如果为 true，监听器在首次执行后会被移除 */
  once?: boolean;
  execute(ctx: ListenerContext): void;
}
