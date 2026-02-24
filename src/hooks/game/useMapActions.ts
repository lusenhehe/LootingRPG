import { useCallback, useRef } from 'react';
import type { GameState, MapProgressState, ActiveTab } from '../../types/game';
import type { MapChapterDef, MapNodeDef } from '../../config/map/mapTypes';
import { applyMapNodeResult, getChapterProgress, isNodeUnlocked, normalizeMapProgress } from '../../logic/mapProgress';
import { MAP_CHAPTERS } from '../../config/map/chapters';
import { getMonsterById } from '../../logic/monsters/config';
import { getRandomMonster } from '../../logic/monsterGeneration';
import { applySingleBattleReward } from '../../logic/battleRewards';
import { simulateBattle } from '../../logic/battle/battleEngine';
import { FRAME_STEP, FRAME_START_DELAY } from '../../config/game/battleConfig';


interface BattleCompleteCallback {
  (args: { simulation: ReturnType<typeof simulateBattle>; isBoss: boolean; mapNodeId?: string }): void;
}

interface UseMapActionsParams {
  gameState: GameState; battleState: any; loading: boolean; mapProgress: MapProgressState;
  hookStartBattleSequence: (isBoss: boolean, context?: any, callback?: BattleCompleteCallback, monsters?: any[]) => void;
  scheduleBattleStep: (callback: () => void, delay: number) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setBattleState: React.Dispatch<React.SetStateAction<any>>;
  setLoading: (loading: boolean) => void;
  setMapProgress: React.Dispatch<React.SetStateAction<MapProgressState>>;
  addLog: (msg: string) => void;
  applyBatchBattleRewards: (state: GameState, monsters: any[]) => { nextState: GameState; droppedName: string; logs: string[] };
  reportError: (err: unknown, context?: { action?: string }) => void;
  onSetTab?: React.Dispatch<React.SetStateAction<ActiveTab>>;
}

export const useMapActions = ({
  gameState, battleState, loading, mapProgress,
  hookStartBattleSequence, scheduleBattleStep,
  setGameState, setBattleState, setLoading, setMapProgress,
  addLog,
  applyBatchBattleRewards,
  reportError,
  onSetTab,
}: UseMapActionsParams) => {
  const pendingMapChallengeRef = useRef<{ node: MapNodeDef; chapter: MapChapterDef } | null>(null);

  const resolveMapChallengeResult = useCallback((won: boolean, context?: { node: MapNodeDef; chapter: MapChapterDef } | null) => {
    const challenge = context ?? pendingMapChallengeRef.current;
    pendingMapChallengeRef.current = null;
    if (!challenge) return;

    const { node, chapter } = challenge;
    const currentProgress = normalizeMapProgress(mapProgress, MAP_CHAPTERS);
    const result = applyMapNodeResult({
      progress: currentProgress,
      chapters: MAP_CHAPTERS,
      chapterId: chapter.id,
      nodeId: node.id,
      won,
    });

    setMapProgress(result.nextProgress);

    if (!won) {
      const failCount = result.nextProgress.failedAttempts[node.id] ?? 0;
      addLog(`[地图] ${node.name} 挑战失败（累计失败 ${failCount} 次）`);
      return;
    }

    if (result.firstClear) {
      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold + node.firstClearRewardGold,
        },
      }));
      addLog(`[地图] 首通 ${node.name}，获得 ${node.firstClearRewardGold} 金币。`);
    } else {
      addLog(`[地图] ${node.name} 已通关，未触发首通奖励。`);
    }

    if (result.unlockedNodeId) {
      addLog(`[地图] 新节点已解锁：${result.unlockedNodeId}`);
    }
    if (result.unlockedChapterId) {
      addLog(`[地图] 新章节已解锁：${result.unlockedChapterId}`);
    }
    if (result.chapterCompleted) {
      const chapterProgress = getChapterProgress(result.nextProgress, chapter);
      if (chapterProgress.completed) {
        addLog(`[地图] ${chapter.name} 已完成。`);
      }
    }
  }, [mapProgress, setMapProgress, setGameState, addLog]);

  const startMapNodeBattle = useCallback((node: MapNodeDef, chapter: MapChapterDef) => {
    if (loading || battleState.phase !== 'idle') return;

    const normalizedProgress = normalizeMapProgress(mapProgress, MAP_CHAPTERS);
    if (!isNodeUnlocked(normalizedProgress, node.id)) {
      addLog(`[地图] ${node.name} 尚未解锁。`);
      return;
    }

    addLog(`[地图] 进入 ${chapter.name} - ${node.name}（${node.encounterType}，推荐Lv.${node.recommendedLevel}）`);
    pendingMapChallengeRef.current = { node, chapter };

    // 自动切换到战斗场景
    onSetTab?.('status');

    if (node.encounterType === 'boss') {
      setBattleState((prev: any) => ({ ...prev, waveContext: undefined }));

      hookStartBattleSequence(true, { mapNodeId: node.id }, ({ simulation, isBoss }) => {
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
                const result = applySingleBattleReward(prev, isBoss, {});
                dropLabel = result.droppedName;
                result.logs.forEach(addLog);

                return prev; // recalculatePlayerStats will be called in the hook
              });

              resolveMapChallengeResult(true, { node, chapter });

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
                systemMessage: failMessage,
                battleResult: failMessage,
              }));
              addLog(failMessage);

              resolveMapChallengeResult(false, { node, chapter });

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
          reportError(err, { action: 'map-battle' });
        }
      });
      return;
    }

    // Handle explicit wave definitions (only `node.waves` is supported now)
    const hasExplicitWaves = node.waves && node.waves.length > 0;
    if (hasExplicitWaves) {
      const waveGroups = node.waves!.map((w) => {
        const group: any[] = [];
        w.monsters.forEach((m) => {
          const count = m.count ?? 1;
          for (let k = 0; k < count; k++) {
            const mon =
              getMonsterById(m.monsterId) ||
              getRandomMonster({
                isBoss: false,
                playerLevel: gameState.playerStats.level,
                encounterCount: battleState.encounterCount,
              });
            if (!getMonsterById(m.monsterId)) {
              console.warn(`配置的波次怪物 id "${m.monsterId}" 未找到，使用随机怪替代。`);
            }
            group.push(mon);
          }
        });
        return group;
      });

      const totalEnemies = waveGroups.reduce((sum, g) => sum + g.length, 0);

      const runWave = (index: number) => {
        const monstersThisWave = waveGroups[index];
        const remainingBefore = waveGroups.slice(0, index).reduce((s, g) => s + g.length, 0);

        setBattleState((prev: any) => ({
          ...prev,
          waveContext: {
            currentWave: index + 1,
            totalWaves: waveGroups.length,
            remainingInWave: monstersThisWave.length,
            remainingTotal: totalEnemies - remainingBefore,
          },
        }));

        hookStartBattleSequence(
          monstersThisWave.some((m: any) => m.isBoss),
          { mapNodeId: node.id },
          ({ simulation }) => {
            try {
              const { playerWon, monsters } = simulation;
              const frameStep = FRAME_STEP;
              const frameStartDelay = FRAME_START_DELAY;
              const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

              if (playerWon) {
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
                    const batch = applyBatchBattleRewards(prev, monsters);
                    dropLabel = batch.droppedName;
                    batch.logs.forEach(addLog);
                    return prev; // recalculatePlayerStats will be called in the hook
                  });

                  if (index === waveGroups.length - 1) {
                    resolveMapChallengeResult(true, { node, chapter });
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
                  if (index < waveGroups.length - 1) {
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
                  const failMessage = `战斗失败：你被怪群压制了，继续强化装备再来挑战！`;
                  setGameState((prev) => ({
                    ...prev,
                    systemMessage: failMessage,
                    battleResult: failMessage,
                  }));
                  addLog(failMessage);

                  resolveMapChallengeResult(false, { node, chapter });

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
                }, battleEndDelay + 320);
              }
            } catch (err) {
              reportError(err, { action: 'map-wave-battle' });
            }
          },
          monstersThisWave,
        );
      };

      runWave(0);
      return;
    }

    // Single monster encounter
    hookStartBattleSequence(false, { mapNodeId: node.id }, ({ simulation, isBoss }) => {
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
              const result = applySingleBattleReward(prev, isBoss, {});
              dropLabel = result.droppedName;
              result.logs.forEach(addLog);

              return prev; // recalculatePlayerStats will be called in the hook
            });

            resolveMapChallengeResult(true, { node, chapter });

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
              systemMessage: failMessage,
              battleResult: failMessage,
            }));
            addLog(failMessage);

            resolveMapChallengeResult(false, { node, chapter });

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
        reportError(err, { action: 'map-battle' });
      }
    });
  }, [loading, battleState.phase, mapProgress, gameState.playerStats.level, battleState.encounterCount, setBattleState, hookStartBattleSequence, scheduleBattleStep, setGameState, addLog, resolveMapChallengeResult, setLoading, reportError, applyBatchBattleRewards]);

  return {
    resolveMapChallengeResult,
    startMapNodeBattle,
  };
};