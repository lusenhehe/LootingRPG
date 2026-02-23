import { useState, useEffect } from 'react';
import {
  ACTIVE_PROFILE_KEY,
  PROFILE_INDEX_KEY,
  createAutoSellQualityMap,
  QUALITY_KEY_MAP,
  STORAGE_KEY,
} from '../../constants/game';
import type { GameState, SavePayload, SaveProfile } from '../../types/game';
import { createFreshInitialState, normalizeGameState } from '../../logic/gameState';
import { recalculatePlayerStats } from '../../logic/playerStats';
import { createInitialBattleState } from '../../logic/gameState';
import { createInitialMapProgress, normalizeMapProgress } from '../../logic/mapProgress';

interface UseProfileSaveParams {
  gameState: GameState;
  logs: string[];
  autoSellQualities: Record<string, boolean>;
  // mapProgress may be managed externally by another hook
  mapProgress?: any;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setAutoSellQualities: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  // battle state resetting is left to the caller to avoid ordering constraints
  setBattleState?: React.Dispatch<React.SetStateAction<any>>;
  setMapProgress?: React.Dispatch<React.SetStateAction<any>>;
  addLog: (msg: string) => void;
}

const getProfileSaveKey = (profileId: string) => `${STORAGE_KEY}_${profileId}`;

export function useProfileSave({
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

    const payload: SavePayload = { gameState, logs, autoSellQualities, mapProgress: mapProgress ?? null };
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
      const eng = QUALITY_KEY_MAP[k] ?? k;
      if (eng in base) {
        base[eng] = v;
      }
    });
    return base;
  };

  const loadProfile = (profileId: string) => {
    // when mapProgress hook is used, caller can update via its own setter
    const payloadText = localStorage.getItem(getProfileSaveKey(profileId));
    if (!payloadText) {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 新玩家存档已创建。']);
      if (setMapProgress) setMapProgress(createInitialMapProgress());
      return;
    }

    try {
      const payload = JSON.parse(payloadText) as SavePayload;
      setGameState(recalculatePlayerStats(normalizeGameState(payload.gameState)));
      setLogs(payload.logs?.length ? payload.logs : ['[系统] 存档已载入。']);
      setAutoSellQualities(convertAutoSell(payload.autoSellQualities));
      if (setMapProgress) setMapProgress(normalizeMapProgress(payload.mapProgress));
    } catch {
      setGameState(createFreshInitialState());
      setLogs(['[系统] 存档损坏，已重置为新存档。']);
      setAutoSellQualities(createAutoSellQualityMap());
      if (setBattleState) setBattleState(createInitialBattleState());
      if (setMapProgress) setMapProgress(createInitialMapProgress());
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
        mapProgress: createInitialMapProgress(),
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
      if (setMapProgress) setMapProgress(createInitialMapProgress());
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

        if ('玩家状态' in parsed) {
          loadProfile(''); // not associated with profile
          setGameState(recalculatePlayerStats(normalizeGameState(parsed)));
          setLogs(['[系统] 存档导入成功。']);
          setAutoSellQualities(createAutoSellQualityMap());
          if (setBattleState) setBattleState(createInitialBattleState());
          if (setMapProgress) setMapProgress(createInitialMapProgress());
        } else {
          loadProfile('');
          setGameState(recalculatePlayerStats(normalizeGameState(parsed.gameState)));
          setLogs(parsed.logs?.length ? parsed.logs : ['[系统] 存档导入成功。']);
          setAutoSellQualities(parsed.autoSellQualities ?? createAutoSellQualityMap());
          if (setBattleState) setBattleState(createInitialBattleState());
          if (setMapProgress) setMapProgress(normalizeMapProgress(parsed.mapProgress));
        }
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
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    loadProfile,
    handleLogout,
  };
}
