/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  ACTIVE_PROFILE_KEY,
  createAutoSellQualityMap,
  getRandomMonster,
  PROFILE_INDEX_KEY,
  STORAGE_KEY,
} from './constants/game';
import type { ActiveTab, BattleRegion, BattleRisk, BattleState, Equipment, GameState, SavePayload, SaveProfile } from './types/game';
import { LoginScreen } from './components/auth/LoginScreen';
import { GameScreen } from './components/game/GameScreen';
import { createFreshInitialState, createInitialBattleState, normalizeGameState } from './logic/gameState';
import { applySingleBattleReward, applyWaveBattleReward } from './logic/battleRewards';
import { quickSellByQualityRange as quickSellBackpackByRange } from './logic/inventory';
import { applyPlayerCommand } from './logic/playerCommands';
import { recalculatePlayerStats } from './logic/playerStats';
import { simulateBattle } from './logic/battle/battleEngine';

const getProfileSaveKey = (profileId: string) => `${STORAGE_KEY}_${profileId}`;

export default function App() {
  const [profiles, setProfiles] = useState<SaveProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => createFreshInitialState());
  const [battleState, setBattleState] = useState<BattleState>(() => createInitialBattleState());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [logs, setLogs] = useState<string[]>(['[系统] 游戏已启动。']);
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [autoBattleEnabled, setAutoBattleEnabled] = useState(false);
  const [battleRegion, setBattleRegion] = useState<BattleRegion>('forest');
  const [battleRisk, setBattleRisk] = useState<BattleRisk>('normal');
  const [spawnMultiplier, setSpawnMultiplier] = useState(1);
  const importInputRef = useRef<HTMLInputElement>(null);
  const battleTimeoutsRef = useRef<number[]>([]);
  const autoBattleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const profileText = localStorage.getItem(PROFILE_INDEX_KEY);
    const lastProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (profileText) {
      try {
        const parsed = JSON.parse(profileText) as SaveProfile[];
        const nextProfiles = Array.isArray(parsed) ? parsed : [];
        setProfiles(nextProfiles);

        if (lastProfileId && nextProfiles.some((profile) => profile.id === lastProfileId)) {
          setActiveProfileId(lastProfileId);
          setIsAuthenticated(true);
          loadProfile(lastProfileId);
        }
      } catch {
        setProfiles([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !activeProfileId) return;

    const payload: SavePayload = { gameState, logs, autoSellQualities };
    localStorage.setItem(getProfileSaveKey(activeProfileId), JSON.stringify(payload));

    setProfiles((prev) => {
      const next = prev.map((profile) =>
        profile.id === activeProfileId ? { ...profile, updatedAt: Date.now() } : profile,
      );
      localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeProfileId, autoSellQualities, gameState, isAuthenticated, logs]);

  const clearBattleTimers = () => {
    battleTimeoutsRef.current.forEach((timerId) => window.clearTimeout(timerId));
    battleTimeoutsRef.current = [];
  };

  const clearAutoBattleTimer = () => {
    if (autoBattleTimeoutRef.current !== null) {
      window.clearTimeout(autoBattleTimeoutRef.current);
      autoBattleTimeoutRef.current = null;
    }
  };

  const scheduleBattleStep = (callback: () => void, delay: number) => {
    const timerId = window.setTimeout(callback, delay);
    battleTimeoutsRef.current.push(timerId);
  };

  useEffect(() => () => {
    clearBattleTimers();
    clearAutoBattleTimer();
  }, []);

  const addLog = (msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  };

  const loadProfile = (profileId: string) => {
    clearBattleTimers();
    clearAutoBattleTimer();
    setAutoBattleEnabled(false);
    const payloadText = localStorage.getItem(getProfileSaveKey(profileId));
    if (!payloadText) {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 新玩家存档已创建。']);
      setBattleState(createInitialBattleState());
      return;
    }

    try {
      const payload = JSON.parse(payloadText) as SavePayload;
      setGameState(recalculatePlayerStats(normalizeGameState(payload.gameState)));
      setLogs(payload.logs?.length ? payload.logs : ['[系统] 存档已载入。']);
      setAutoSellQualities(payload.autoSellQualities ?? createAutoSellQualityMap());
      setBattleState(createInitialBattleState());
    } catch {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 存档损坏，已重置为新存档。']);
      setAutoSellQualities(createAutoSellQualityMap());
      setBattleState(createInitialBattleState());
    }
  };

  const handleLogin = (profileId: string) => {
    setActiveProfileId(profileId);
    setForgeSelectedId(null);
    setActiveTab('status');
    loadProfile(profileId);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    setIsAuthenticated(true);
  };

  const handleCreateProfile = (name: string) => {
    const id = `profile_${Date.now()}`;
    const profile: SaveProfile = {
      id,
      name,
      updatedAt: Date.now(),
    };

    setProfiles((prev) => {
      const next = [profile, ...prev];
      localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(next));
      return next;
    });

    localStorage.setItem(getProfileSaveKey(id), JSON.stringify({ gameState: createFreshInitialState(), logs: ['[系统] 新玩家存档已创建。'] } satisfies SavePayload));
    handleLogin(id);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles((prev) => {
      const next = prev.filter((profile) => profile.id !== profileId);
      localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(next));
      return next;
    });

    localStorage.removeItem(getProfileSaveKey(profileId));

    if (activeProfileId === profileId) {
      clearBattleTimers();
      clearAutoBattleTimer();
      setIsAuthenticated(false);
      setActiveProfileId(null);
      setGameState(createFreshInitialState());
      setLogs(['[系统] 请登录玩家存档。']);
      setAutoSellQualities(createAutoSellQualityMap());
      setBattleState(createInitialBattleState());
      setLoading(false);
      setAutoBattleEnabled(false);
    }
  };

  const handleExportSave = () => {
    if (!activeProfileId) return;

    const payload: SavePayload = {
      gameState,
      logs,
      autoSellQualities,
    };

    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loot-grinder-save-${activeProfileId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('存档已导出为 JSON 文件。');
  };

  const handleImportSave = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SavePayload | GameState;

      if ('玩家状态' in parsed) {
        clearBattleTimers();
        setGameState(recalculatePlayerStats(normalizeGameState(parsed)));
        setLogs(['[系统] 存档导入成功。']);
        setAutoSellQualities(createAutoSellQualityMap());
        setBattleState(createInitialBattleState());
      } else {
        clearBattleTimers();
        setGameState(recalculatePlayerStats(normalizeGameState(parsed.gameState)));
        setLogs(parsed.logs?.length ? parsed.logs : ['[系统] 存档导入成功。']);
        setAutoSellQualities(parsed.autoSellQualities ?? createAutoSellQualityMap());
        setBattleState(createInitialBattleState());
      }
      addLog('已从 JSON 文件导入存档。');
    } catch {
      addLog('导入失败：JSON 格式无效。');
    } finally {
      event.target.value = '';
    }
  };

  const startBattleSequence = (isBoss: boolean) => {
    if (loading || battleState.phase !== 'idle') return;

    clearBattleTimers();
    setLoading(true);

    const simulation = simulateBattle(
      getRandomMonster({ isBoss, region: battleRegion, risk: battleRisk, spawnMultiplier }),
      gameState.玩家状态,
      battleState.encounterCount,
      isBoss,
      battleRisk,
    );
    const monster = simulation.monster;

    if (isBoss) {
      if (monster.bossIdentity?.introLine) {
        addLog(`[首领降临] ${monster.bossIdentity.introLine}`);
      }
      if (monster.bossIdentity?.battleLogLine) {
        addLog(`[战场异象] ${monster.bossIdentity.battleLogLine}`);
      }
      if (monster.counterGoalLabel) {
        addLog(`[Boss机制] ${monster.counterGoalLabel}`);
      }
    }

    setBattleState((prev) => ({
      ...prev,
      phase: 'entering',
      currentMonster: monster,
      isBossBattle: isBoss,
      playerHpPercent: 100,
      monsterHpPercent: 100,
      showAttackFlash: false,
      playerDamageLabel: null,
      monsterDamageLabel: null,
      playerStatusLabel: null,
      monsterStatusLabel: null,
      elementLabel: null,
      showDropAnimation: false,
      dropLabel: null,
      encounterCount: prev.encounterCount + 1,
    }));

    scheduleBattleStep(() => {
      setBattleState((prev) => ({ ...prev, phase: 'fighting' }));
    }, 500);

    const frameStartDelay = 760;
    const frameStep = 260;
    simulation.frames.forEach((frame, index) => {
      scheduleBattleStep(() => {
        frame.combatLogs?.forEach(addLog);
        setBattleState((prev) => ({
          ...prev,
          monsterHpPercent: frame.monsterHpPercent,
          playerHpPercent: frame.playerHpPercent,
          showAttackFlash: frame.showAttackFlash,
          playerDamageLabel: frame.playerDamageLabel ?? null,
          monsterDamageLabel: frame.monsterDamageLabel ?? null,
          playerStatusLabel: frame.playerStatusLabel ?? null,
          monsterStatusLabel: frame.monsterStatusLabel ?? null,
          elementLabel: frame.elementLabel ?? null,
        }));
      }, frameStartDelay + index * frameStep);
    });

    const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;

    if (simulation.playerWon) {
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
      return;
    }

    scheduleBattleStep(() => {
      const failMessage = `战斗失败：你被 ${monster.name} 压制了，继续强化装备再来挑战！`;
      setGameState((prev) => ({
        ...prev,
        系统消息: failMessage,
        战斗结果: failMessage,
      }));
      addLog(failMessage);

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
  };

  const startMonsterWaveBattle = (waveSize = 5) => {
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

      setLoading(false);
    }, 220);
  };

  const toggleAutoBattle = () => {
    setAutoBattleEnabled((prev) => {
      const next = !prev;
      if (!next) {
        clearAutoBattleTimer();
      }
      addLog(next ? '自动出怪已开启。' : '自动出怪已关闭。');
      return next;
    });
  };

  useEffect(() => {
    if (!autoBattleEnabled || loading || battleState.phase !== 'idle') {
      clearAutoBattleTimer();
      return;
    }

    clearAutoBattleTimer();
    autoBattleTimeoutRef.current = window.setTimeout(() => {
      autoBattleTimeoutRef.current = null;
      const bossChance = battleRisk === 'nightmare' ? 0.35 : battleRisk === 'normal' ? 0.2 : 0.1;
      startBattleSequence(Math.random() < bossChance);
    }, 450);

    return () => clearAutoBattleTimer();
  }, [autoBattleEnabled, battleRisk, battleState.phase, loading]);

  const quickSellByQualityRange = (minQuality: string, maxQuality: string) => {
    setGameState((prev) => {
      const result = quickSellBackpackByRange(prev, minQuality, maxQuality);
      addLog(result.message);
      return recalculatePlayerStats(result.nextState);
    });
  };

  const processAction = (command: string) => {
    setLoading(true);

    setTimeout(() => {
      setGameState((prev) => {
        const result = applyPlayerCommand(prev, command);
        result.logs.forEach(addLog);
        return recalculatePlayerStats(result.nextState);
      });
      setLoading(false);
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
      battleRegion={battleRegion}
      battleRisk={battleRisk}
      spawnMultiplier={spawnMultiplier}
      autoSellQualities={autoSellQualities}
      forgeSelectedId={forgeSelectedId}
      importInputRef={importInputRef}
      onImportFileChange={handleImportFileChange}
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
      onLogout={() => {
        clearBattleTimers();
        clearAutoBattleTimer();
        setIsAuthenticated(false);
        setActiveProfileId(null);
        setBattleState(createInitialBattleState());
        setLoading(false);
        setAutoBattleEnabled(false);
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }}
      onReset={() => {
        if (confirm('确定要重置存档吗？')) {
          clearBattleTimers();
          clearAutoBattleTimer();
          setGameState(createFreshInitialState());
          setBattleState(createInitialBattleState());
          setLoading(false);
          setAutoBattleEnabled(false);
          setLogs(['[系统] 存档已重置。']);
        }
      }}
      onSetTab={setActiveTab}
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
