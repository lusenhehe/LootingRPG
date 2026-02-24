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
  autoBattleEnabled, loading, battleState,
  setAutoBattleEnabled, startBattleSequence, addLog,
}: UseAutoBattleParams) => {
  const autoBattleTimeoutRef = useRef<number | null>(null);
  // 选择一个合理的时间间隔来自动触发战斗，既要避免过快又要保持流畅。
  const toggleAutoBattle = () => {
    setAutoBattleEnabled((prev) => {
      const next = !prev;
      if (!next) clearAutoBattleTimer();
      addLog(next ? '自动出怪已开启。' : '自动出怪已关闭。');
      return next;
    });
  };
  /// 清除自动出怪的定时器，确保在不需要自动出怪时不会触发战斗。
  const clearAutoBattleTimer = () => {
    if (autoBattleTimeoutRef.current !== null) {
      window.clearTimeout(autoBattleTimeoutRef.current);
      autoBattleTimeoutRef.current = null;
    }
  };
  /// 当自动出怪开启且当前不在战斗中时，设置一个定时器来触发下一场战斗。
  //  每次战斗结束后（即战斗状态回到idle），都会重新评估是否继续自动出怪。
  useEffect(() => {
    /// 只有在自动出怪开启、
    // 当前不在战斗中（idle状态）且不是加载状态时，才会设置定时器来触发下一场战斗。
    if (!autoBattleEnabled || loading || battleState.phase !== 'idle') {
      clearAutoBattleTimer();
      return;
    }
    clearAutoBattleTimer();
    autoBattleTimeoutRef.current = null;
    const bossChance = 0.2;
    startBattleSequence(Math.random() < bossChance);
    return () => clearAutoBattleTimer();
  }, [autoBattleEnabled, battleState.phase, loading, startBattleSequence]);

  return {
    toggleAutoBattle,
    clearAutoBattleTimer,
  };
};