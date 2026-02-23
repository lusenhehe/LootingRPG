import { useEffect, useRef } from 'react';

interface UseAutoBattleParams {
  autoBattleEnabled: boolean;
  loading: boolean;
  battleState: any;
  setAutoBattleEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  startBattleSequence: (isBoss: boolean) => void;
  addLog: (msg: string) => void;
}

export const useAutoBattle = ({
  autoBattleEnabled,
  loading,
  battleState,
  setAutoBattleEnabled,
  startBattleSequence,
  addLog,
}: UseAutoBattleParams) => {
  const autoBattleTimeoutRef = useRef<number | null>(null);

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

  const clearAutoBattleTimer = () => {
    if (autoBattleTimeoutRef.current !== null) {
      window.clearTimeout(autoBattleTimeoutRef.current);
      autoBattleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!autoBattleEnabled || loading || battleState.phase !== 'idle') {
      clearAutoBattleTimer();
      return;
    }

    clearAutoBattleTimer();
    autoBattleTimeoutRef.current = window.setTimeout(() => {
      autoBattleTimeoutRef.current = null;
      const bossChance = 0.2;
      startBattleSequence(Math.random() < bossChance);
    }, 450);

    return () => clearAutoBattleTimer();
  }, [autoBattleEnabled, battleState.phase, loading, startBattleSequence]);

  return {
    toggleAutoBattle,
    clearAutoBattleTimer,
  };
};