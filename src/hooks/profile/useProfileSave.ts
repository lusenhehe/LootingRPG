import type { GameState, MapProgressState, SavePayload, SaveProfile } from '../../shared/types/game';
import { createInitialMapProgress, normalizeMapProgress } from '../../domains/map/services/progress';
import { ACTIVE_PROFILE_KEY, PROFILE_INDEX_KEY, STORAGE_KEY } from '../../config/runtime/storage';
import { createFreshInitialState, normalizeGameState } from '../../app/state';
import { createAutoSellQualityMap } from '../../domains/inventory/services/autoSell';
import { recalculatePlayerStats } from '../../domains/player/services/recalculatePlayerStats';
import { MAP_CHAPTERS } from '../../config/map/ChapterData';
import { useState, useEffect } from 'react';
/// 个人存档管理逻辑，包含创建/加载/保存/删除存档，以及导入导出功能
interface UseProfileSaveParams {
  gameState: GameState; logs: string[]; autoSellQualities: Record<string, boolean>; mapProgress: MapProgressState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setLogs:      React.Dispatch<React.SetStateAction<string[]>>;
  setAutoSellQualities: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setMapProgress:  React.Dispatch<React.SetStateAction<MapProgressState>>;
  addLog: (msg: string) => void;
}
/// 存档键名生成函数，基于 profileId 生成对应的 localStorage 键名
const getProfileSaveKey = (profileId: string) => `${STORAGE_KEY}_${profileId}`;
/// 个人存档管理 Hook，提供存档列表、当前活跃存档 ID、认证状态，以及登录/创建/删除/导入/导出存档的处理函数
export function useProfileSave({
  gameState, logs, autoSellQualities, mapProgress,
  setGameState, setLogs, setAutoSellQualities, setMapProgress, addLog,
}: UseProfileSaveParams) {
  const [profiles, setProfiles] = useState<SaveProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveProfileId(null);
  };
  /// 初始加载：从 localStorage 读取存档列表和最后活跃的存档 ID，尝试加载对应存档
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
      const freshLogs = ['[System] Local save cache cleared. Rebuilt with latest initial state.'];
      const freshMapProgress = createInitialMapProgress(MAP_CHAPTERS);
      const freshAutoSell = createAutoSellQualityMap();

      setGameState(freshGameState);
      setLogs(freshLogs);
      setMapProgress(freshMapProgress);
      setAutoSellQualities(freshAutoSell);

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

      addLog('Local cache was empty. Rebuilt save with latest initial state.');
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
      setLogs(['[System] New player save created.']);
      setAutoSellQualities(createAutoSellQualityMap());
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
      return;
    }

    try {
      const payload = JSON.parse(payloadText) as SavePayload;
      setGameState(recalculatePlayerStats(normalizeGameState(payload.gameState)));
      setLogs(payload.logs?.length ? payload.logs : ['[System] Save loaded.']);
      setAutoSellQualities(convertAutoSell(payload.autoSellQualities));
      setMapProgress(normalizeMapProgress(payload.mapProgress, MAP_CHAPTERS));
    } catch {
      setGameState(createFreshInitialState());
      setLogs(['[System] Save data corrupted. Reset to a fresh save.']);
      setAutoSellQualities(createAutoSellQualityMap());
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
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
        logs: ['[System] New player save created.'],
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
      setLogs(['[System] Please sign in to a player save.']);
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
    link.download = `LootingRPG_Save.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('Save exported as JSON file.');
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
        const parsed = JSON.parse(text) as SavePayload;

        const isRecord = (value: unknown): value is Record<string, unknown> => {
          return typeof value === 'object' && value !== null;
        };

        if (!isRecord(parsed) || !('gameState' in parsed)) {
          throw new Error('Invalid save payload');
        }

        const payload = parsed;
        loadProfile('');
        setGameState(recalculatePlayerStats(normalizeGameState(payload.gameState)));
        setLogs(payload.logs?.length ? payload.logs : ['[System] Save imported successfully.']);
        setAutoSellQualities(payload.autoSellQualities ?? createAutoSellQualityMap());
        setMapProgress(normalizeMapProgress(payload.mapProgress, MAP_CHAPTERS));
        addLog('Save imported from JSON file.');
      } catch {
        addLog('Import failed: invalid JSON payload.');
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
