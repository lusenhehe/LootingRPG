/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  ACTIVE_PROFILE_KEY,
  createAutoSellQualityMap,
} from './constants/game';
import type { ActiveTab, BattleRegion, BattleRisk, GameState } from './types/game';
// extracted hooks for better separation of concerns
import { useBattleFlow } from './hooks/battle/useBattleFlow';
import { useProfileSave } from './hooks/profile/useProfileSave';
import { useMapProgress } from './hooks/map/useMapProgress';
import { LoginScreen } from './components/auth/LoginScreen';
import { GameScreen } from './components/game/GameScreen';
import { createFreshInitialState, createInitialBattleState, normalizeGameState } from './logic/gameState';
import { applySingleBattleReward, applyWaveBattleReward } from './logic/battleRewards';
import { quickSellByQualityRange as quickSellBackpackByRange } from './logic/inventory';
import { applyPlayerCommand } from './logic/playerCommands';
import { recalculatePlayerStats } from './logic/playerStats';
import type { MapNode } from './types/map';
import { createInitialMapProgress, getCurrentMapNode } from './logic/mapProgress';

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
  // mapProgress will be managed by useMapProgress hook below
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [autoBattleEnabled, setAutoBattleEnabled] = useState(false);
  const autoBattleTimeoutRef = useRef<number | null>(null);
  const [battleRegion, setBattleRegion] = useState<BattleRegion>('forest');
  const [battleRisk, setBattleRisk] = useState<BattleRisk>('normal');
  const [spawnMultiplier, setSpawnMultiplier] = useState(1);

  // ---------- hooks ----------
  const {
    mapProgress,
    setMapProgress,
    markVictory: registerMapNodeVictoryHook,
    markFailure: registerMapNodeFailureHook,
  } = useMapProgress();

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
    setBattleState,
    setMapProgress,
    addLog,
  });
  interface BattleStartOptions {
    region?: BattleRegion;
    risk?: BattleRisk;
    spawn?: number;
    mapNodeId?: string;
  }
  const startBattleSequence = (isBoss: boolean, options?: BattleStartOptions) => {
    hookStartBattleSequence(isBoss, options, ({ simulation, isBoss, mapNodeId }) => {
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

              if (mapNodeId) {
                const mapResult = registerMapNodeVictoryHook(mapNodeId);
                if (mapResult?.firstClear) {
                  const nodeReward = getCurrentMapNode({
                    ...mapProgress,
                    currentNodeId: mapNodeId,
                  })?.firstClearRewardGold ?? 0;
                  if (nodeReward > 0) {
                    result.nextState.玩家状态.金币 += nodeReward;
                    addLog(`地图首通奖励：+${nodeReward} 金币`);
                  }
                }
                if (mapResult?.nextNode) {
                  addLog(`地图推进：已进入节点 ${mapResult.nextNode.order}. ${mapResult.nextNode.name}`);
                }
              }

              return recalculatePlayerStats(result.nextState);
            });

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

            if (mapNodeId) {
              registerMapNodeFailureHook(mapNodeId);
            }

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
        reportError(err, { action: 'battle', mapNodeId });
      }
    });
  };

  const startMonsterWaveBattle = (waveSize = 5, mapNodeId?: string) => {
    if (loading || battleState.phase !== 'idle' || waveSize <= 0) return;

    clearBattleTimers();
    setLoading(true);

    scheduleBattleStep(() => {
      let waveSummary = '';

      setGameState((prev) => {
        const result = applyWaveBattleReward(prev, waveSize, autoSellQualities);
        waveSummary = result.summary;

        if (mapNodeId) {
          const mapResult = registerMapNodeVictoryHook(mapNodeId);
          if (mapResult?.firstClear) {
            const nodeReward = getCurrentMapNode({
              ...mapProgress,
              currentNodeId: mapNodeId,
            })?.firstClearRewardGold ?? 0;
            if (nodeReward > 0) {
              result.nextState.玩家状态.金币 += nodeReward;
              addLog(`地图首通奖励：+${nodeReward} 金币`);
            }
          }
          if (mapResult?.nextNode) {
            addLog(`地图推进：已进入节点 ${mapResult.nextNode.order}. ${mapResult.nextNode.name}`);
          }
        }

        return recalculatePlayerStats(result.nextState);
      });

      setBattleState((prev) => ({
        ...prev,
        encounterCount: prev.encounterCount + waveSize,
      }));

      if (waveSummary) {
        addLog(waveSummary);
      }

      setLoading(false);
    }, 220);
  };

  const startCurrentMapNodeBattle = () => {
    const node = getCurrentMapNode(mapProgress);
    if (!node || loading || battleState.phase !== 'idle') return;

    if (node.encounterType === 'wave') {
      startMonsterWaveBattle(node.waveSize ?? 5, node.id);
      return;
    }

    startBattleSequence(node.encounterType === 'boss', {
      region: node.region,
      risk: node.risk,
      spawn: node.spawnMultiplier,
      mapNodeId: node.id,
    });
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
      const bossChance = battleRisk === 'nightmare' ? 0.35 : battleRisk === 'normal' ? 0.2 : 0.1;
      startBattleSequence(Math.random() < bossChance);
    }, 450);

    return () => clearAutoBattleTimerLocal();
  }, [autoBattleEnabled, battleRisk, battleState.phase, loading]);

  const quickSellByQualityRange = (minQuality: string, maxQuality: string) => {
    setGameState((prev) => {
      const result = quickSellBackpackByRange(prev, minQuality, maxQuality);
      addLog(result.message);
      return recalculatePlayerStats(result.nextState);
    });
  };

  const reportError = (err: unknown, context: { action?: string; mapNodeId?: string } = {}) => {
    const message = err instanceof Error ? err.message : String(err);
    const parts = [`[错误] ${message}`, `profile=${activeProfileId}`];
    if (context.action) parts.push(`action=${context.action}`);
    if (context.mapNodeId) parts.push(`mapNode=${context.mapNodeId}`);
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
  const currentMapNode: MapNode | null = getCurrentMapNode(mapProgress) ?? null;

  return (
    <GameScreen
      gameState={gameState}
      battleState={battleState}
      activeTab={activeTab}
      loading={loading}
      playerName={currentProfile?.name || '未知玩家'}
      autoBattleEnabled={autoBattleEnabled}
      battleRegion={battleRegion}
      battleRisk={battleRisk}
      spawnMultiplier={spawnMultiplier}
      autoSellQualities={autoSellQualities}
      mapProgress={mapProgress}
      currentMapNode={currentMapNode}
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
        setMapProgress(createInitialMapProgress());
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
          setMapProgress(createInitialMapProgress());
          setLogs(['[系统] 存档已重置。']);
        }
      }}
      onSetTab={setActiveTab}
      onChallengeCurrentMapNode={startCurrentMapNodeBattle}
      onChallengeMonster={() => startBattleSequence(false)}
      onChallengeBoss={() => startBattleSequence(true)}
      onChallengeWave={() => startMonsterWaveBattle(5)}
      onToggleAutoBattle={toggleAutoBattle}
      onSetBattleRegion={setBattleRegion}
      onSetBattleRisk={setBattleRisk}
      onSetSpawnMultiplier={setSpawnMultiplier}
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
