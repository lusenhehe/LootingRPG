import type { GameState } from '../../shared/types/game';

/**
 * 全量 GameState 动作类型。
 *
 * 设计原则：
 * - Reducer 保持纯函数，不调用 domain 服务；所有状态计算在 hook 层完成后以 payload 传入。
 * - 每个 action 类型名称对应一个语义动作，便于 DevTools / 日志追踪。
 * - `SET` 保留为向后兼容通道，新代码应使用语义类型。
 */
export type GameStateAction =
  // ── 系统 ─────────────────────────────────────────────────
  /** 重置存档到初始状态 */
  | { type: 'RESET' }
  /** 加载存档（登录/切换存档） */
  | { type: 'LOAD_SAVE'; payload: GameState }
  /** 重置存档内容（确认重置操作） */
  | { type: 'SYSTEM/RESET_SAVE'; payload: GameState }

  // ── 背包 / 装备 ───────────────────────────────────────────
  /** 执行单次背包操作（装备/出售/锻造/重铸/卸下） */
  | { type: 'INVENTORY/APPLY'; payload: GameState }
  /** 按品质批量出售 */
  | { type: 'INVENTORY/QUICK_SELL'; payload: GameState }
  /** 添加调试物品 */
  | { type: 'DEBUG/ADD_ITEMS'; payload: GameState }

  // ── 战斗 ────────────────────────────────────────────────
  /** 进入地图节点，开启战斗会话 */
  | { type: 'BATTLE/START'; payload: GameState }
  /** 战斗内回合推进（攻击/技能） */
  | { type: 'BATTLE/UPDATE'; payload: GameState }
  /** 撤退，结束战斗 */
  | { type: 'BATTLE/RETREAT'; payload: GameState }
  /** 关闭结算界面 */
  | { type: 'BATTLE/CLOSE_RESULT'; payload: GameState }

  // ── 向后兼容通道（暂不迁移的调用使用此类型） ──────────────
  | { type: 'SET'; payload: GameState };
