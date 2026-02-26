import { normalizeInventory } from './inventoryState';
import type { BattleSession, GameState } from '../../shared/types/game';

const normalizeBattleSession = (session: BattleSession | null): BattleSession | null => {
  if (!session) return null;

  const enemies = (session.enemies ?? []).map((enemy, index) => ({
    ...enemy,
    meta: {
      ...(enemy.meta ?? {}),
      waveId:
        typeof enemy.meta?.waveId === 'string'
          ? enemy.meta.waveId
          : `wave-${index + 1}`,
    },
  }));

  const inferredWaveOrder = Array.from(
    new Set(
      enemies.map((enemy, index) =>
        typeof enemy.meta?.waveId === 'string' ? enemy.meta.waveId : `wave-${index + 1}`,
      ),
    ),
  );
  const existingWaveOrder = Array.isArray(session.waveOrder) ? session.waveOrder : [];
  const waveOrder = existingWaveOrder.length > 0
    ? existingWaveOrder.filter((waveId) => inferredWaveOrder.includes(waveId))
    : inferredWaveOrder;

  const safeWaveOrder = waveOrder.length > 0 ? waveOrder : inferredWaveOrder;
  const maxIndex = Math.max(0, safeWaveOrder.length - 1);
  const currentWaveIndex = Number.isFinite(session.currentWaveIndex)
    ? Math.max(0, Math.min(maxIndex, session.currentWaveIndex))
    : 0;

  return {
    ...session,
    enemies,
    waveOrder: safeWaveOrder,
    currentWaveIndex,
    phase: session.phase ?? 'player_input',
    events: Array.isArray(session.events) ? session.events : [],
  };
};

/**
 * Normalizes the entire game state, including inventory and equipment
 */
export const normalizeGameState = (state: GameState): GameState => {
  const { normalizedBackpack, normalizedCurrent } = normalizeInventory(state.backpack, state.currentEquipment);

  return {
    ...state,
    backpack: normalizedBackpack,
    currentEquipment: normalizedCurrent,
    battle: {
      activeSession: normalizeBattleSession(state.battle?.activeSession ?? null),
      history: Array.isArray(state.battle?.history) ? state.battle.history : [],
    },
  };
};

// Re-export all state creation and management functions
export { createFreshInitialState } from './globalState';
export { normalizeInventory } from './inventoryState';

// Export the StateManager class
export { StateManager } from './stateManager';