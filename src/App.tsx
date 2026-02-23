import { useEffect, useRef, useState } from 'react';
import {
  ACTIVE_PROFILE_KEY,
  createAutoSellQualityMap,
} from './constants/game';
import type { ActiveTab, GameState, MapProgressState } from './types/game';
// extracted hooks for better separation of concerns
import { useBattleFlow } from './hooks/battle/useBattleFlow';
import { useProfileSave } from './hooks/profile/useProfileSave';
import { LoginScreen } from './components/auth/LoginScreen';
import { GameScreen } from './components/game/GameScreen';
import { createFreshInitialState, createInitialBattleState } from './logic/gameState';
import { applySingleBattleReward } from './logic/battleRewards';
import { getMonsterById } from './constants/monsterData';
import { getRandomMonster } from './constants/game';
import { quickSellByQualityRange as quickSellBackpackByRange } from './logic/inventory';
import { applyPlayerCommand } from './logic/playerCommands';
import { recalculatePlayerStats } from './logic/playerStats';
import { MAP_CHAPTERS, type MapChapterDef, type MapNodeDef } from './config/mapChapters';
import type { Monster } from './types/game';
import { applyMapNodeResult, createInitialMapProgress, getChapterProgress, isNodeUnlocked, normalizeMapProgress} from './logic/mapProgress';

export default function App() {
  // pulled out into hooks; some pieces remain for passing down
  const [gameState, setGameState] = useState<GameState>(() => createFreshInitialState());
  const [logs, setLogs] = useState<string[]>(['[系统] 游戏已启动。']);

  const addLog = (msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  };
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());
  const [mapProgress, setMapProgress] = useState<MapProgressState>(() => createInitialMapProgress(MAP_CHAPTERS));
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [autoBattleEnabled, setAutoBattleEnabled] = useState(false);
  const autoBattleTimeoutRef = useRef<number | null>(null);
  const pendingMapChallengeRef = useRef<{ node: MapNodeDef; chapter: MapChapterDef } | null>(null);

  const {
    battleState,
    loading,
    setLoading,
    startBattleSequence: hookStartBattleSequence,
    clearBattleTimers,
    // clearAutoBattleTimer removed; we'll handle auto-battle timers locally
    scheduleBattleStep,
    setBattleState,
  } = useBattleFlow({ gameState, addLog });

  const {
    profiles,
    activeProfileId,
    isAuthenticated,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    handleLogout,
  } = useProfileSave({
    gameState,
    logs,
    autoSellQualities,
    mapProgress,
    setGameState,
    setLogs,
    setAutoSellQualities,
    setMapProgress,
    setBattleState,
    addLog,
  });

  const resolveMapChallengeResult = (won: boolean, context?: { node: MapNodeDef; chapter: MapChapterDef } | null) => {
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
        玩家状态: {
          ...prev.玩家状态,
          金币: prev.玩家状态.金币 + node.firstClearRewardGold,
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
  };

  const applyBatchBattleRewards = (state: GameState, monsters: Monster[]) => {
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
  };

  const startBattleSequence = (isBoss: boolean) => {
    hookStartBattleSequence(isBoss, undefined, ({ simulation, isBoss }) => {
      try {
        const { playerWon, monster } = simulation;
        const frameStep = 260;   // these values match previous hardcoded ones
        const frameStartDelay = 760;
        const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

        if (playerWon) {
          scheduleBattleStep(() => {
            setBattleState((prev) => ({ ...prev, phase: 'dying', monsterHpPercent: 0, showAttackFlash: false }));
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

            setBattleState((prev) => ({
              ...prev,
              phase: 'dropping',
              showDropAnimation: true,
              dropLabel,
              playerDamageLabel: null,
              monsterDamageLabel: null,
            }));
          }, battleEndDelay + 420);

          scheduleBattleStep(() => {
            setBattleState((prev) => ({
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

            setBattleState((prev) => ({
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
  };

  const startMonsterWaveBattle = (waveSize = 5, mapChallenge?: { node: MapNodeDef; chapter: MapChapterDef }) => {
    if (loading || battleState.phase !== 'idle' || waveSize <= 0) return;

    // generate each random monster and treat each as one wave
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
      setBattleState((prev) => ({
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
              setBattleState((prev) => ({
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

              setBattleState((prev) => ({
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
                setBattleState((prev) => ({
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

              setBattleState((prev) => ({
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
    setActiveTab('status');
  };

  const startMapNodeBattle = (node: MapNodeDef, chapter: MapChapterDef) => {
    if (loading || battleState.phase !== 'idle') return;
    // ensure any leftover wave context is cleared when user triggers a standalone fight
    setBattleState((prev) => ({ ...prev, waveContext: undefined }));

    const normalizedProgress = normalizeMapProgress(mapProgress, MAP_CHAPTERS);
    if (!isNodeUnlocked(normalizedProgress, node.id)) {
      addLog(`[地图] ${node.name} 尚未解锁。`);
      return;
    }

    addLog(`[地图] 进入 ${chapter.name} - ${node.name}（${node.encounterType}，推荐Lv.${node.recommendedLevel}）`);
    pendingMapChallengeRef.current = { node, chapter };

    if (node.encounterType === 'boss') {
      // clear wave context before starting a single map boss battle
      setBattleState((prev) => ({ ...prev, waveContext: undefined }));
      hookStartBattleSequence(true, { mapNodeId: node.id }, ({ simulation, isBoss }) => {
        try {
          const { playerWon, monster } = simulation;
          const frameStep = 260;
          const frameStartDelay = 760;
          const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

          if (playerWon) {
            scheduleBattleStep(() => {
              setBattleState((prev) => ({ ...prev, phase: 'dying', monsterHpPercent: 0, showAttackFlash: false }));
            }, battleEndDelay + 180);

            scheduleBattleStep(() => {
              let dropLabel = '未知战利品';

              setGameState((prev) => {
                const result = applySingleBattleReward(prev, isBoss, autoSellQualities);
                dropLabel = result.droppedName;
                result.logs.forEach(addLog);

                return recalculatePlayerStats(result.nextState);
              });

              resolveMapChallengeResult(true, { node, chapter });

              setBattleState((prev) => ({
                ...prev,
                phase: 'dropping',
                showDropAnimation: true,
                dropLabel,
                playerDamageLabel: null,
                monsterDamageLabel: null,
              }));
            }, battleEndDelay + 420);

            scheduleBattleStep(() => {
              setBattleState((prev) => ({
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

              resolveMapChallengeResult(false, { node, chapter });

              setBattleState((prev) => ({
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
      setActiveTab('status');
      return;
    }

    // treat any node that has waves defined (or a legacy waveSize) as a multi‑monster encounter
    // sequentially process each configured wave so monsters arrive in batches
    const hasExplicitWaves = node.waves && node.waves.length > 0;
    const hasLegacySize = !!node.waveSize;
    if (hasExplicitWaves || hasLegacySize) {
      let waveGroups: Monster[][];
      if (hasExplicitWaves) {
        // build groups from explicit definitions
        waveGroups = node.waves!.map((w) => {
          const group: Monster[] = [];
          w.monsters.forEach((m) => {
            const count = m.count ?? 1;
            for (let k = 0; k < count; k++) {
              const mon =
                getMonsterById(m.monsterId) ||
                getRandomMonster({
                  isBoss: false,
                  playerLevel: gameState.玩家状态.等级,
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
      } else {
        // legacy waveSize: create that many random single‑monster waves
        waveGroups = Array.from({ length: node.waveSize! }).map(() => [
          getRandomMonster({
            isBoss: false,
            playerLevel: gameState.玩家状态.等级,
            encounterCount: battleState.encounterCount,
          }),
        ]);
      }

      const totalEnemies = waveGroups.reduce((sum, g) => sum + g.length, 0);
      let currentWaveIndex = 0;

      const runWave = (index: number) => {
        const monstersThisWave = waveGroups[index];
        const remainingBefore = waveGroups.slice(0, index).reduce((s, g) => s + g.length, 0);

        setBattleState((prev) => ({
          ...prev,
          waveContext: {
            currentWave: index + 1,
            totalWaves: waveGroups.length,
            remainingInWave: monstersThisWave.length,
            remainingTotal: totalEnemies - remainingBefore,
          },
        }));

        hookStartBattleSequence(
          monstersThisWave.some((m) => m.isBoss),
          { mapNodeId: node.id },
          ({ simulation }) => {
            try {
              const { playerWon, monsters } = simulation;
              const frameStep = 260;
              const frameStartDelay = 760;
              const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

              if (playerWon) {
                scheduleBattleStep(() => {
                  setBattleState((prev) => ({
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
                    return recalculatePlayerStats(batch.nextState);
                  });

                  // only resolve map challenge on final wave
                  if (index === waveGroups.length - 1) {
                    resolveMapChallengeResult(true, { node, chapter });
                  }

                  setBattleState((prev) => ({
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
                    // start next wave after a short pause
                    runWave(index + 1);
                  } else {
                    // all done, return to idle
                    setBattleState((prev) => ({
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
                    系统消息: failMessage,
                    战斗结果: failMessage,
                  }));
                  addLog(failMessage);

                  resolveMapChallengeResult(false, { node, chapter });

                  setBattleState((prev) => ({
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
      setActiveTab('status');
      return;
    }

    hookStartBattleSequence(false, { mapNodeId: node.id }, ({ simulation, isBoss }) => {
      try {
        const { playerWon, monster } = simulation;
        const frameStep = 260;
        const frameStartDelay = 760;
        const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

        if (playerWon) {
          scheduleBattleStep(() => {
            setBattleState((prev) => ({ ...prev, phase: 'dying', monsterHpPercent: 0, showAttackFlash: false }));
          }, battleEndDelay + 180);

          scheduleBattleStep(() => {
            let dropLabel = '未知战利品';

            setGameState((prev) => {
              const result = applySingleBattleReward(prev, isBoss, autoSellQualities);
              dropLabel = result.droppedName;
              result.logs.forEach(addLog);

              return recalculatePlayerStats(result.nextState);
            });

            resolveMapChallengeResult(true, { node, chapter });

            setBattleState((prev) => ({
              ...prev,
              phase: 'dropping',
              showDropAnimation: true,
              dropLabel,
              playerDamageLabel: null,
              monsterDamageLabel: null,
            }));
          }, battleEndDelay + 420);

          scheduleBattleStep(() => {
            setBattleState((prev) => ({
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

            resolveMapChallengeResult(false, { node, chapter });

            setBattleState((prev) => ({
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
    setActiveTab('status');
  };

  const toggleAutoBattle = () => {
    setAutoBattleEnabled((prev) => {
      const next = !prev;
      if (!next) {
        clearAutoBattleTimerLocal();
      }
      addLog(next ? '自动出怪已开启。' : '自动出怪已关闭。');
      return next;
    });
  };

  const clearAutoBattleTimerLocal = () => {
    if (autoBattleTimeoutRef.current !== null) {
      window.clearTimeout(autoBattleTimeoutRef.current);
      autoBattleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!autoBattleEnabled || loading || battleState.phase !== 'idle') {
      clearAutoBattleTimerLocal();
      return;
    }

    clearAutoBattleTimerLocal();
    autoBattleTimeoutRef.current = window.setTimeout(() => {
      autoBattleTimeoutRef.current = null;
      const bossChance = 0.2;
      startBattleSequence(Math.random() < bossChance);
    }, 450);

    return () => clearAutoBattleTimerLocal();
  }, [autoBattleEnabled, battleState.phase, loading]);

  const quickSellByQualityRange = (minQuality: string, maxQuality: string) => {
    setGameState((prev) => {
      const result = quickSellBackpackByRange(prev, minQuality, maxQuality);
      addLog(result.message);
      return recalculatePlayerStats(result.nextState);
    });
  };

  const reportError = (err: unknown, context: { action?: string } = {}) => {
    const message = err instanceof Error ? err.message : String(err);
    const parts = [`[错误] ${message}`, `profile=${activeProfileId}`];
    if (context.action) parts.push(`action=${context.action}`);
    addLog(parts.join(' '));
  };

  const processAction = (command: string) => {
    setLoading(true);

    setTimeout(() => {
      try {
        setGameState((prev) => {
          try {
            const result = applyPlayerCommand(prev, command);
            result.logs.forEach(addLog);
            return recalculatePlayerStats(result.nextState);
          } catch (error) {
            reportError(error, { action: command });
            return prev;
          }
        });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        profiles={profiles}
        onLogin={handleLogin}
        onCreate={handleCreateProfile}
        onDelete={handleDeleteProfile}
      />
    );
  }
  const currentProfile = profiles.find((profile) => profile.id === activeProfileId);

  return (
    <GameScreen
      gameState={gameState}
      battleState={battleState}
      activeTab={activeTab}
      loading={loading}
      playerName={currentProfile?.name || '未知玩家'}
      autoBattleEnabled={autoBattleEnabled}
      autoSellQualities={autoSellQualities}
      forgeSelectedId={forgeSelectedId}
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
      onLogout={() => {
        clearBattleTimers();
        clearAutoBattleTimerLocal();
        handleLogout();
        setBattleState(createInitialBattleState());
        setLoading(false);
        setAutoBattleEnabled(false);
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }}
      onReset={() => {
        if (confirm('确定要重置存档吗？')) {
          clearBattleTimers();
          clearAutoBattleTimerLocal();
          setGameState(createFreshInitialState());
          setBattleState(createInitialBattleState());
          setLoading(false);
          setAutoBattleEnabled(false);
          setLogs(['[系统] 存档已重置。']);
          setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
        }
      }}
      mapProgress={mapProgress}
      onSelectMapChapter={(chapterId) => {
        setMapProgress((prev) => ({ ...prev, selectedChapterId: chapterId }));
      }}
      onSetTab={setActiveTab}
      onChallengeMonster={() => startBattleSequence(false)}
      onChallengeBoss={() => startBattleSequence(true)}
      onChallengeWave={() => startMonsterWaveBattle(5)}
      onEnterMapNode={startMapNodeBattle}
      onToggleAutoBattle={toggleAutoBattle}
      onQuickSellByQualityRange={quickSellByQualityRange}
      onEquip={(id) => processAction(`装备 ${id}`)}
      onSell={(id) => processAction(`出售 ${id}`)}
      onForge={(id) => processAction(`强化 ${id}`)}
      onToggleAutoSellQuality={(quality) => {
        setAutoSellQualities((prev) => ({ ...prev, [quality]: !prev[quality] }));
      }}
      onReroll={(id) => processAction(`洗练 ${id}`)}
      onSelectForgeItem={setForgeSelectedId}
      onUnequip={(slot) => processAction(`卸下槽位 ${slot}`)}
    />
  );
}
