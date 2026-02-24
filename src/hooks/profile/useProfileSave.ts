import { useState, useEffect } from 'react';
import { MAP_CHAPTERS } from '../../config/map/chapters';
import { recalculatePlayerStats } from '../../logic/playerStats';
import { createInitialBattleState } from '../../logic/gameState';
import { createFreshInitialState, normalizeGameState } from '../../logic/gameState';
import { convertGameState } from '../../logic/nameConversion';
import { createInitialMapProgress, normalizeMapProgress } from '../../logic/mapProgress';
import type { GameState, MapProgressState, SavePayload, SaveProfile, BattleState } from '../../types/game';
import { createAutoSellQualityMap } from '../../logic/inventory/autoSell';
import { ACTIVE_PROFILE_KEY, PROFILE_INDEX_KEY, STORAGE_KEY } from '../../config/runtime/storage';

interface UseProfileSaveParams {
  gameState: GameState; logs: string[]; autoSellQualities: Record<string, boolean>; mapProgress: MapProgressState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setAutoSellQualities: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setMapProgress: React.Dispatch<React.SetStateAction<MapProgressState>>;
  setBattleState?: React.Dispatch<React.SetStateAction<BattleState>>;
  addLog: (msg: string) => void;
}

const getProfileSaveKey = (profileId: string) => `${STORAGE_KEY}_${profileId}`;

export function useProfileSave({
  gameState, logs, autoSellQualities, mapProgress,
  setGameState, setLogs, setAutoSellQualities, setMapProgress, setBattleState, addLog,
}: UseProfileSaveParams) {
  const [profiles, setProfiles] = useState<SaveProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveProfileId(null);
  };

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

    const profileKey = getProfileSaveKey(activeProfileId);
    const profileExists = Boolean(localStorage.getItem(profileKey));
    if (!profileExists) {
      const freshGameState = createFreshInitialState();
      const freshLogs = ['[系统] 检测到本地存档已清理，已按最新初始配置重建。'];
      const freshMapProgress = createInitialMapProgress(MAP_CHAPTERS);
      const freshAutoSell = createAutoSellQualityMap();

      setGameState(freshGameState);
      setLogs(freshLogs);
      setMapProgress(freshMapProgress);
      setAutoSellQualities(freshAutoSell);
      if (setBattleState) setBattleState(createInitialBattleState());

      localStorage.setItem(
        profileKey,
        JSON.stringify({
          gameState: freshGameState,
          logs: freshLogs,
          autoSellQualities: freshAutoSell,
          mapProgress: freshMapProgress,
        } satisfies SavePayload),
      );

      setProfiles((prev) => {
        const next = prev.map((profile) =>
          profile.id === activeProfileId ? { ...profile, updatedAt: Date.now() } : profile,
        );
        localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(next));
        return next;
      });

      addLog('检测到本地缓存已清空，已重建为最新初始存档。');
      return;
    }

    const payload: SavePayload = { gameState, logs, autoSellQualities, mapProgress };
    localStorage.setItem(getProfileSaveKey(activeProfileId), JSON.stringify(payload));

    setProfiles((prev) => {
      const next = prev.map((profile) =>
        profile.id === activeProfileId ? { ...profile, updatedAt: Date.now() } : profile,
      );
      localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeProfileId, autoSellQualities, gameState, isAuthenticated, logs, mapProgress]);

  const convertAutoSell = (orig: Record<string, boolean> = {}) => {
    const base = createAutoSellQualityMap();
    Object.entries(orig).forEach(([k, v]) => {
      if (k in base) {
        base[k] = v;
      }
    });
    return base;
  };

  const loadProfile = (profileId: string) => {
    const payloadText = localStorage.getItem(getProfileSaveKey(profileId));
    if (!payloadText) {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 新玩家存档已创建。']);
      setAutoSellQualities(createAutoSellQualityMap());
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
      if (setBattleState) setBattleState(createInitialBattleState());
      return;
    }

    try {
      const payload = JSON.parse(payloadText) as SavePayload;
      const converted = convertGameState(payload.gameState as any);
      setGameState(recalculatePlayerStats(normalizeGameState(converted)));
      setLogs(payload.logs?.length ? payload.logs : ['[系统] 存档已载入。']);
      setAutoSellQualities(convertAutoSell(payload.autoSellQualities));
      setMapProgress(normalizeMapProgress(payload.mapProgress, MAP_CHAPTERS));
    } catch {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 存档损坏，已重置为新存档。']);
      setAutoSellQualities(createAutoSellQualityMap());
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
      if (setBattleState) setBattleState(createInitialBattleState());
    }
  };


  const handleLogin = (profileId: string) => {
    setActiveProfileId(profileId);
    setIsAuthenticated(true);
    loadProfile(profileId);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
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

    localStorage.setItem(
      getProfileSaveKey(id),
      JSON.stringify({
        gameState: createFreshInitialState(),
        logs: ['[系统] 新玩家存档已创建。'],
        mapProgress: createInitialMapProgress(MAP_CHAPTERS),
      } satisfies SavePayload),
    );
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
      setIsAuthenticated(false);
      setActiveProfileId(null);
      setGameState(createFreshInitialState());
      setLogs(['[系统] 请登录玩家存档。']);
      setAutoSellQualities(createAutoSellQualityMap());
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
    }
  };

  const handleExportSave = () => {
    if (!activeProfileId) return;
    const payload: SavePayload = {
      gameState,
      logs,
      autoSellQualities,
      mapProgress,
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as SavePayload | GameState;

        // normalize into SavePayload structure for downstream code
        let payload: SavePayload;
        if ((parsed as any).playerStats && !(parsed as any).gameState) {
          // old-style import: top-level game state
          payload = {
            gameState: parsed as GameState,
            logs: ['[系统] 存档导入成功。'],
            autoSellQualities: createAutoSellQualityMap(),
            mapProgress: createInitialMapProgress(MAP_CHAPTERS),
          };
        } else {
          payload = parsed as SavePayload;
        }

        // convert legacy key names inside gameState if needed
        const converted = convertGameState(payload.gameState as any);
        payload.gameState = converted;

        loadProfile(''); // not associated with profile
        setGameState(recalculatePlayerStats(normalizeGameState(payload.gameState)));
        setLogs(payload.logs?.length ? payload.logs : ['[系统] 存档导入成功。']);
        setAutoSellQualities(payload.autoSellQualities ?? createAutoSellQualityMap());
        setMapProgress(normalizeMapProgress(payload.mapProgress, MAP_CHAPTERS));
        if (setBattleState) setBattleState(createInitialBattleState());
        addLog('已从 JSON 文件导入存档。');
      } catch {
        addLog('导入失败：JSON 格式无效。');
      }
    };
    input.click();
  };

  return {
    profiles,
    activeProfileId,
    isAuthenticated,
    handleLogin, handleCreateProfile, handleDeleteProfile, handleExportSave, handleImportSave, loadProfile, handleLogout,
  };
}
