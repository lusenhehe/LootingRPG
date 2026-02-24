import { FRAME_STEP, FRAME_START_DELAY } from '../../config/game/battleConfig';
import type { MapChapterDef, MapNodeDef } from '../../config/map/mapTypes';
import type { BattleState, GameState, Monster } from '../../types/game';
import { applySingleBattleReward } from '../../logic/battleRewards';
import { simulateBattle } from '../../logic/battle/battleEngine';
import { getRandomMonster } from '../../logic/monsterGeneration';
import { recalculatePlayerStats } from '../../logic/playerStats';
import { useCallback } from 'react';

const createIdleBattleState = (extraFields: Partial<BattleState> = {}): BattleState => ({
  phase: 'idle',
  currentMonsters: [],
  monsterHpPercents: [],
  currentMonster: null,
  isBossBattle: false,
  playerHpPercent: 100,
  monsterHpPercent: 100,
  showAttackFlash: false,
  monsterDamageLabels: [],
  monsterStatusLabels: [],
  playerDamageLabel: null,
  monsterDamageLabel: null,
  playerStatusLabel: null,
  monsterStatusLabel: null,
  elementLabel: null,
  showDropAnimation: false,
  dropLabel: null,
  encounterCount: 0,
  ...extraFields,
});

interface BattleCompleteCallback {
  (args: { simulation: ReturnType<typeof simulateBattle>; isBoss: boolean; mapNodeId?: string }): void;
}

interface UseBattleActionsParams {
  gameState: GameState;
  battleState: any;
  loading: boolean;
  autoSellQualities: Record<string, boolean>;
  hookStartBattleSequence: (isBoss: boolean, context?: any, callback?: BattleCompleteCallback, monsters?: Monster[]) => void;
  scheduleBattleStep: (callback: () => void, delay: number) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setBattleState: React.Dispatch<React.SetStateAction<any>>;
  setLoading: (loading: boolean) => void;
  addLog: (msg: string) => void;
  resolveMapChallengeResult: (won: boolean, context?: { node: MapNodeDef; chapter: MapChapterDef } | null) => void;
  reportError: (err: unknown, context?: { action?: string }) => void;
}

export const useBattleActions = ({
  gameState,
  battleState,
  loading,
  autoSellQualities,
  hookStartBattleSequence,
  scheduleBattleStep,
  setGameState,
  setBattleState,
  setLoading,
  addLog,
  resolveMapChallengeResult,
  reportError,
}: UseBattleActionsParams) => {
  const applyBatchBattleRewards = useCallback((state: GameState, monsters: Monster[]) => {
    let nextState = state;
    const allLogs: string[] = [];
    let droppedName = '未知战利品';

    monsters.forEach((monster) => {
      const result = applySingleBattleReward(nextState, !!monster.isBoss, autoSellQualities);
      nextState = result.nextState;
      droppedName = result.droppedName;
      allLogs.push(...result.logs);
    });

    return {
      nextState,
      droppedName,
      logs: allLogs,
    };
  }, [autoSellQualities]);

  const startBattleSequence = useCallback((isBoss: boolean) => {
    hookStartBattleSequence(isBoss, undefined, ({ simulation, isBoss }) => {
      try {
        const { playerWon, monster } = simulation;
        const frameStep = FRAME_STEP;
        const frameStartDelay = FRAME_START_DELAY;
        const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

        if (playerWon) {
          scheduleBattleStep(() => {
            setBattleState((prev: any) => ({ ...prev, phase: 'dying', monsterHpPercent: 0, showAttackFlash: false }));
          }, battleEndDelay + 180);

          scheduleBattleStep(() => {
            let dropLabel = '未知战利品';

            setGameState((prev) => {
              const result = applySingleBattleReward(prev, isBoss, autoSellQualities);
              dropLabel = result.droppedName;
              result.logs.forEach(addLog);

              return recalculatePlayerStats(result.nextState);
            });

            resolveMapChallengeResult(true);

            setBattleState((prev: any) => ({
              ...prev,
              phase: 'dropping',
              showDropAnimation: true,
              dropLabel,
              playerDamageLabel: null,
              monsterDamageLabel: null,
            }));
          }, battleEndDelay + 420);

          scheduleBattleStep(() => {
            setBattleState(() => createIdleBattleState());
            setLoading(false);
          }, battleEndDelay + 1100);
        } else {
          scheduleBattleStep(() => {
            const failMessage = `战斗失败：你被 ${monster.name} 压制了，继续强化装备再来挑战！`;
            setGameState((prev) => ({
              ...prev,
              systemMessage: failMessage,
              battleResult: failMessage,
            }));
            addLog(failMessage);

            resolveMapChallengeResult(false);

            setBattleState(() => createIdleBattleState());
            setLoading(false);
          }, battleEndDelay + 320);
        }
      } catch (err) {
        reportError(err, { action: 'battle' });
      }
    });
  }, [hookStartBattleSequence, scheduleBattleStep, setGameState, setBattleState, setLoading, addLog, resolveMapChallengeResult, reportError, autoSellQualities]);

  const startMonsterWaveBattle = useCallback((waveSize = 5, mapChallenge?: { node: MapNodeDef; chapter: MapChapterDef }) => {
    if (loading || battleState.phase !== 'idle' || waveSize <= 0) return;
    const monsters = Array.from({ length: waveSize }).map(() =>
      getRandomMonster({
        isBoss: false,
        playerLevel: gameState.playerStats.level  ,
        encounterCount: battleState.encounterCount,
      }),
    );

    let waveIndex = 0;
    const total = monsters.length;

    const runWave = (index: number) => {
      const group = [monsters[index]];
      setBattleState((prev: any) => ({
        ...prev,
        waveContext: {
          currentWave: index + 1,
          totalWaves: total,
          remainingInWave: group.length,
          remainingTotal: total - index,
        },
      }));

      hookStartBattleSequence(false, undefined, ({ simulation }) => {
        try {
          const frameStep = FRAME_STEP;
          const frameStartDelay = FRAME_START_DELAY;
          const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

          if (simulation.playerWon) {
            /// 更新当前怪物状态为死亡，播放死亡动画
            setBattleState((prev: any) => ({
              ...prev, phase: 'dying',
              monsterHpPercent: 0, monsterHpPercents: prev.currentMonsters.map(() => 0),
              showAttackFlash: false,
            }));
            /// 结算奖励，更新状态，播放掉落动画
            let dropLabel = '未知战利品';
            setGameState((prev) => {
              const batch = applyBatchBattleRewards(prev, simulation.monsters);
              dropLabel = batch.droppedName;
              batch.logs.forEach(addLog);
              return recalculatePlayerStats(batch.nextState);
            });
            /// 如果这是最后一波，且来自地图挑战，则结算地图挑战结果
            if (mapChallenge && index === total - 1) {
              resolveMapChallengeResult(true, mapChallenge);
            }
            /// 播放掉落动画
            setBattleState((prev: any) => ({
              ...prev,
              phase: 'dropping',
              showDropAnimation: true,
              dropLabel,
              playerDamageLabel: null,
              monsterDamageLabel: null,
              monsterDamageLabels: prev.currentMonsters.map(() => ''),
            }));
            /// 如果还有下一波，继续下一波的战斗；否则结束战斗并结算奖励。
            handleNextWave();
          } else {
            scheduleBattleStep(() => {
              const failMessage = '战斗失败：你被怪群压制了，继续强化装备再来挑战！';
              setGameState((prev) => ({
                ...prev,
                systemMessage: failMessage,
                battleResult: failMessage,
              }));
              addLog(failMessage);

              if (mapChallenge) {
                resolveMapChallengeResult(false, mapChallenge);
              }

              setBattleState(() => createIdleBattleState({ waveContext: undefined }));
              setLoading(false);
            }, battleEndDelay + 320);
          }
        } catch (err) {
          reportError(err, { action: 'wave-battle' });
        }

        function handleNextWave() {
          if (index < total - 1) {
            runWave(index + 1);
          } else {
            setBattleState(() => createIdleBattleState({ waveContext: undefined }));
            setLoading(false);
          }
        }
      }, group);
    };

    runWave(0);
  }, [loading, battleState.phase, battleState.encounterCount, gameState.playerStats.level, setBattleState, hookStartBattleSequence, scheduleBattleStep, setGameState, applyBatchBattleRewards, addLog, resolveMapChallengeResult, setLoading, reportError]);

  return {
    startBattleSequence,
    startMonsterWaveBattle,
    applyBatchBattleRewards,
  };
};