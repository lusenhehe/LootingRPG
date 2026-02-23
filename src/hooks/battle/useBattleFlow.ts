import { useState, useRef, useEffect } from 'react';
import type { BattleState, BattleRegion, BattleRisk, GameState } from '../../types/game';
import { createInitialBattleState } from '../../logic/gameState';
import { simulateBattle } from '../../logic/battle/battleEngine';
import { getRandomMonster } from '../../constants/game';

export interface BattleStartOptions {
  region?: BattleRegion;
  risk?: BattleRisk;
  spawn?: number;
  mapNodeId?: string;
}

interface UseBattleFlowParams {
  gameState: GameState;
  addLog: (msg: string) => void;
}

export function useBattleFlow({ gameState, addLog }: UseBattleFlowParams) {
  const [battleState, setBattleState] = useState<BattleState>(() => createInitialBattleState());
  const [loading, setLoading] = useState(false);
  const battleTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      clearBattleTimers();
    };
  }, []);

  const clearBattleTimers = () => {
    battleTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    battleTimeoutsRef.current = [];
  };

  // auto-battle timer is managed by caller;
  const clearAutoBattleTimer = () => {
    // no-op
  };

  const scheduleBattleStep = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    battleTimeoutsRef.current.push(id);
  };

  /**
   * begin a fight; caller can optionally provide `onComplete` to run logic after
   * the simulated frames have finished (e.g. rewards, map progression).
   */
  const startBattleSequence = (
    isBoss: boolean,
    options?: BattleStartOptions,
    onComplete?: (args: { simulation: ReturnType<typeof simulateBattle>; isBoss: boolean; mapNodeId?: string }) => void,
  ) => {
    if (loading || battleState.phase !== 'idle') return;

    clearBattleTimers();
    setLoading(true);

    const region = options?.region ?? 'forest';
    const risk = options?.risk ?? 'normal';
    const spawn = options?.spawn ?? 1;
    const mapNodeId = options?.mapNodeId;

    const simulation = simulateBattle(
      getRandomMonster({ isBoss, region, risk, spawnMultiplier: spawn }),
      gameState.玩家状态,
      battleState.encounterCount,
      isBoss,
      risk,
    );
    const monster = simulation.monster;

    if (isBoss && monster.bossIdentity?.introLine) {
      addLog(monster.bossIdentity.introLine);
    }

    setBattleState((prev) => ({
      ...prev,
      phase: 'entering',
      currentMonster: monster,
      isBossBattle: isBoss,
      monsterHpPercent: 100,
      showAttackFlash: true,
      encounterCount: prev.encounterCount + 1,
    }));

    const advance = (frame: number) => {
      if (frame >= simulation.frames.length) {
        // don't clear loading here; let the scheduled completion callback handle it
        return;
      }

      const f = simulation.frames[frame];
      setBattleState((prev) => ({
        ...prev,
        playerHpPercent: f.playerHpPercent,
        monsterHpPercent: f.monsterHpPercent,
        showAttackFlash: f.showAttackFlash,
        playerDamageLabel: f.playerDamageLabel ?? null,
        monsterDamageLabel: f.monsterDamageLabel ?? null,
        playerStatusLabel: f.playerStatusLabel ?? null,
        monsterStatusLabel: f.monsterStatusLabel ?? null,
        elementLabel: f.elementLabel ?? null,
      }));

      scheduleBattleStep(() => advance(frame + 1), 120);
    };

    scheduleBattleStep(() => advance(0), 120);

    // schedule the onComplete callback once frames are done
    const frameStartDelay = 120;
    const frameStep = 120;
    const battleEndDelay = frameStartDelay + simulation.frames.length * frameStep;
    if (onComplete) {
      scheduleBattleStep(() => {
        onComplete({ simulation, isBoss, mapNodeId });
        setLoading(false);
      }, battleEndDelay);
    } else {
      // fallback: clear loading when done
      scheduleBattleStep(() => setLoading(false), battleEndDelay);
    }
  };

  return {
    battleState,
    loading,
    setLoading,
    startBattleSequence,
    clearBattleTimers,
    clearAutoBattleTimer,
    scheduleBattleStep,
    setBattleState,
  };
}
