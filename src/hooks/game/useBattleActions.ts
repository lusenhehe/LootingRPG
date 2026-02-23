import { useCallback } from 'react';
import type { GameState, Monster } from '../../types/game';
import type { MapChapterDef, MapNodeDef } from '../../logic/adapters/mapChapterAdapter';
import { applySingleBattleReward } from '../../logic/battleRewards';
import { getMonsterById } from '../../logic/adapters/monsterConfigAdapter';
import { getRandomMonster } from '../../logic/monsterGeneration';
import { recalculatePlayerStats } from '../../logic/playerStats';

interface UseBattleActionsParams {
  gameState: GameState;
  battleState: any;
  loading: boolean;
  autoSellQualities: Record<string, boolean>;
  hookStartBattleSequence: (isBoss: boolean, context?: any, callback?: any, monsters?: Monster[]) => void;
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
        const frameStep = 260;
        const frameStartDelay = 760;
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
            setBattleState((prev: any) => ({
              ...prev,
              phase: 'idle',
              currentMonster: null,
              currentMonsters: [],
              monsterHpPercents: [],
              monsterDamageLabels: [],
              monsterStatusLabels: [],
              showDropAnimation: false,
              showAttackFlash: false,
              playerDamageLabel: null,
              monsterDamageLabel: null,
              playerStatusLabel: null,
              monsterStatusLabel: null,
              elementLabel: null,
            }));
            setLoading(false);
          }, battleEndDelay + 1100);
        } else {
          scheduleBattleStep(() => {
            const failMessage = `战斗失败：你被 ${monster.name} 压制了，继续强化装备再来挑战！`;
            setGameState((prev) => ({
              ...prev,
              系统消息: failMessage,
              战斗结果: failMessage,
            }));
            addLog(failMessage);

            resolveMapChallengeResult(false);

            setBattleState((prev: any) => ({
              ...prev,
              phase: 'idle',
              currentMonster: null,
              currentMonsters: [],
              monsterHpPercents: [],
              monsterDamageLabels: [],
              monsterStatusLabels: [],
              showDropAnimation: false,
              showAttackFlash: false,
              playerDamageLabel: null,
              monsterDamageLabel: null,
              playerStatusLabel: null,
              monsterStatusLabel: null,
              elementLabel: null,
            }));
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
        playerLevel: gameState.玩家状态.等级,
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
          const frameStep = 260;
          const frameStartDelay = 760;
          const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

          if (simulation.playerWon) {
            scheduleBattleStep(() => {
              setBattleState((prev: any) => ({
                ...prev,
                phase: 'dying',
                monsterHpPercent: 0,
                monsterHpPercents: prev.currentMonsters.map(() => 0),
                showAttackFlash: false,
              }));
            }, battleEndDelay + 180);

            scheduleBattleStep(() => {
              let dropLabel = '未知战利品';
              setGameState((prev) => {
                const batch = applyBatchBattleRewards(prev, simulation.monsters);
                dropLabel = batch.droppedName;
                batch.logs.forEach(addLog);
                return recalculatePlayerStats(batch.nextState);
              });

              if (mapChallenge && index === total - 1) {
                resolveMapChallengeResult(true, mapChallenge);
              }

              setBattleState((prev: any) => ({
                ...prev,
                phase: 'dropping',
                showDropAnimation: true,
                dropLabel,
                playerDamageLabel: null,
                monsterDamageLabel: null,
                monsterDamageLabels: prev.currentMonsters.map(() => ''),
              }));
            }, battleEndDelay + 420);

            scheduleBattleStep(() => {
              if (index < total - 1) {
                runWave(index + 1);
              } else {
                setBattleState((prev: any) => ({
                  ...prev,
                  phase: 'idle',
                  currentMonster: null,
                  currentMonsters: [],
                  monsterHpPercents: [],
                  monsterDamageLabels: [],
                  monsterStatusLabels: [],
                  showDropAnimation: false,
                  showAttackFlash: false,
                  playerDamageLabel: null,
                  monsterDamageLabel: null,
                  playerStatusLabel: null,
                  monsterStatusLabel: null,
                  elementLabel: null,
                  waveContext: undefined,
                }));
                setLoading(false);
              }
            }, battleEndDelay + 1100);
          } else {
            scheduleBattleStep(() => {
              const failMessage = '战斗失败：你被怪群压制了，继续强化装备再来挑战！';
              setGameState((prev) => ({
                ...prev,
                系统消息: failMessage,
                战斗结果: failMessage,
              }));
              addLog(failMessage);

              if (mapChallenge) {
                resolveMapChallengeResult(false, mapChallenge);
              }

              setBattleState((prev: any) => ({
                ...prev,
                phase: 'idle',
                currentMonster: null,
                currentMonsters: [],
                monsterHpPercents: [],
                showDropAnimation: false,
                showAttackFlash: false,
                playerDamageLabel: null,
                monsterDamageLabel: null,
                monsterDamageLabels: [],
                playerStatusLabel: null,
                monsterStatusLabel: null,
                monsterStatusLabels: [],
                elementLabel: null,
                waveContext: undefined,
              }));
              setLoading(false);
            }, battleEndDelay + 320);
          }
        } catch (err) {
          reportError(err, { action: 'wave-battle' });
        }
      }, group);
    };

    runWave(0);
  }, [loading, battleState.phase, battleState.encounterCount, gameState.玩家状态.等级, setBattleState, hookStartBattleSequence, scheduleBattleStep, setGameState, applyBatchBattleRewards, addLog, resolveMapChallengeResult, setLoading, reportError]);

  return {
    startBattleSequence,
    startMonsterWaveBattle,
    applyBatchBattleRewards,
  };
};