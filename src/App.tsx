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
import { applySingleBattleReward, applyWaveBattleReward } from './logic/battleRewards';
import { quickSellByQualityRange as quickSellBackpackByRange } from './logic/inventory';
import { applyPlayerCommand } from './logic/playerCommands';
import { recalculatePlayerStats } from './logic/playerStats';
import { MAP_CHAPTERS, type MapChapterDef, type MapNodeDef } from './config/mapChapters';
import {
  applyMapNodeResult,
  createInitialMapProgress,
  getChapterProgress,
  isNodeUnlocked,
  normalizeMapProgress,
} from './logic/mapProgress';

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

    clearBattleTimers();
    setLoading(true);

    scheduleBattleStep(() => {
      let waveSummary = '';

      setGameState((prev) => {
        const result = applyWaveBattleReward(prev, waveSize, autoSellQualities);
        waveSummary = result.summary;

        return recalculatePlayerStats(result.nextState);
      });

      setBattleState((prev) => ({
        ...prev,
        encounterCount: prev.encounterCount + waveSize,
      }));

      if (waveSummary) {
        addLog(waveSummary);
      }

      if (mapChallenge) {
        resolveMapChallengeResult(true, mapChallenge);
      }

      setLoading(false);
    }, 220);
  };

  const startMapNodeBattle = (node: MapNodeDef, chapter: MapChapterDef) => {
    if (loading || battleState.phase !== 'idle') return;

    const normalizedProgress = normalizeMapProgress(mapProgress, MAP_CHAPTERS);
    if (!isNodeUnlocked(normalizedProgress, node.id)) {
      addLog(`[地图] ${node.name} 尚未解锁。`);
      return;
    }

    addLog(`[地图] 进入 ${chapter.name} - ${node.name}（${node.encounterType}，推荐Lv.${node.recommendedLevel}）`);
    pendingMapChallengeRef.current = { node, chapter };

    if (node.encounterType === 'boss') {
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

    if (node.encounterType === 'wave') {
      startMonsterWaveBattle(node.waveSize ?? 5, { node, chapter });
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
