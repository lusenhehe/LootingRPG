import type { BattleState, GameState, Monster } from '../../types/game';
import { simulateBattle } from '../../logic/battle/battleEngine.ts';
import { createInitialBattleState } from '../../logic/gameState';
import { getRandomMonster } from '../../logic/monsterGeneration';
import { useState, useRef, useEffect } from 'react';
/// 自定义 React Hook，管理战斗流程和状态
export function useBattleFlow({ gameState, addLog }: { gameState: GameState; addLog: (msg: string) => void }) {
  const [battleState, setBattleState] = useState<BattleState>(() => createInitialBattleState());
  const [loading, setLoading] = useState(false);
  const battleTimeoutsRef = useRef<number[]>([]);
  /// 组件卸载时清理所有未完成的战斗定时器，防止内存泄漏和状态更新错误
  useEffect(() => { return () => { clearBattleTimers(); }; }, []);
  /// 清理所有战斗相关的定时器，通常在战斗结束或被打断时调用
  const clearBattleTimers = () => {
    battleTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    battleTimeoutsRef.current = [];
  };
  /// 调度一个新的战斗步骤，接受一个回调函数和延迟时间，返回定时器 ID 以便后续清理
  const scheduleBattleStep = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    battleTimeoutsRef.current.push(id);
  };
  /// 启动一个新的战斗序列，
  /// 接受是否为 Boss 战的标志、可选的战斗开始选项、
  /// 完成回调和强制怪物参数
  const startBattleSequence = (
    isBoss: boolean,
    options?: { mapNodeId?: string },
    onComplete?: (args: { simulation: ReturnType<typeof simulateBattle>; isBoss: boolean; mapNodeId?: string }) => void,
    forcedMonster?: Monster | Monster[],
  ) => {
    if (loading || battleState.phase !== 'idle') return;
    /// 启动战斗前先清理任何现有的战斗定时器，确保新的战斗环境干净
    clearBattleTimers();
    setLoading(true);
    // 如果 options 中提供了 mapNodeId，则在生成怪物时传入该参数，以便根据地图节点特性调整怪物生成逻辑
    const mapNodeId = options?.mapNodeId;
    /// 生成战斗模拟数据，使用强制怪物参数（如果提供）或根据玩家等级和战斗次数随机生成怪物
    const simulation = simulateBattle(
      forcedMonster || getRandomMonster({ isBoss, playerLevel: gameState.playerStats.level, encounterCount: battleState.encounterCount}),
      gameState.playerStats, battleState.encounterCount, isBoss, mapNodeId,
    );
    if (isBoss && simulation.monster.bossIdentity?.introLine) {
      addLog(simulation.monster.bossIdentity.introLine);
    }

    setBattleState((prev) => ({
      ...prev,
      phase: 'entering',
      currentMonsters:   simulation.monsters,
      monsterHpPercents: simulation.monsters.map(() => 100),
      currentMonster:    simulation.monster,
      isBossBattle:      isBoss,
      monsterHpPercent:  100,
      showAttackFlash:   true,
      monsterDamageLabels: simulation.monsters.map(() => ''),
      monsterStatusLabels: simulation.monsters.map(() => ''),
      encounterCount: prev.encounterCount + 1,
    }));

    const advance = (frame: number) => {
      // 如果当前帧数超过模拟的总帧数，说明战斗动画已经完成，直接返回，不再调度后续帧
      if (frame >= simulation.frames.length)  return;
      // 获取当前帧的数据，根据模拟结果更新战斗状态，包括玩家和怪物的 HP 百分比、伤害和状态标签等
      const f = simulation.frames[frame];
      setBattleState((prev) => {
        const updated: Partial<typeof prev> = {
          playerHpPercent: f.playerHpPercent,
          monsterHpPercents: f.monsterHpPercents ?? prev.monsterHpPercents,
          monsterHpPercent: f.monsterHpPercent,
          showAttackFlash: f.showAttackFlash,
          monsterDamageLabels: f.monsterDamageLabels ?? prev.monsterDamageLabels,
          monsterStatusLabels: f.monsterStatusLabels ?? prev.monsterStatusLabels,
          playerDamageLabel: f.playerDamageLabel ?? null,
          monsterDamageLabel: f.monsterDamageLabel ?? null,
          playerStatusLabel: f.playerStatusLabel ?? null,
          monsterStatusLabel: f.monsterStatusLabel ?? null,
          elementLabel: f.elementLabel ?? null,
        };

        // update wave context remaining count if applicable
        if (prev.waveContext) {
          const alive = (f.monsterHpPercents ?? prev.monsterHpPercents).filter((p) => p > 0).length;
          updated.waveContext = {
            ...prev.waveContext,
            remainingInWave: alive,
          };
        }

        return {
          ...prev,
          ...updated,
        } as typeof prev;
      });
      advance(frame + 1);
    };
    // 调度第一帧的显示，通常会有一个短暂的延迟，以便玩家看到战斗开始的动画效果
    advance(0);
    // 战斗结束后清理定时器并调用完成回调，传递模拟结果、是否为 Boss 战和地图节点 ID 等信息
    setLoading(false);
    if (onComplete) {
      onComplete({ simulation, isBoss, mapNodeId });
    }
  };

  return {
    battleState,
    loading,
    setLoading,
    startBattleSequence,
    clearBattleTimers,
    scheduleBattleStep,
    setBattleState,
  };
}
