import { useCallback } from 'react';
import { runBattlePlayerAttack, runBattleRetreat, startBattleSession, runBattlePlayerSkill, closeBattleResult } from '../../domains/battle/services/session';
import { MAP_CHAPTERS } from '../../config/map/ChapterData';
import type { GameState, MapProgressState } from '../../shared/types/game';
import type { ActiveTab } from '../../shared/types/game';
import type { GameStateAction } from '../../app/state/actions';

interface UseBattleSessionParams {
  gameState: GameState;
  mapProgress: MapProgressState;
  dispatchGameState: React.Dispatch<GameStateAction>;
  setMapProgress: React.Dispatch<React.SetStateAction<MapProgressState>>;
  addLog: (msg: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  setFocusMapNode: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * 提供战斗相关的快捷处理函数，将 domain 服务返回的结果应用回 React 状态并记录日志
 */
export function useBattleSession({
  gameState,
  mapProgress,
  dispatchGameState,
  setMapProgress,
  addLog,
  setActiveTab,
  setFocusMapNode,
}: UseBattleSessionParams) {
  const handleBattleAttack = useCallback((targetId?: string) => {
    const result = runBattlePlayerAttack(gameState, mapProgress, MAP_CHAPTERS, targetId);
    dispatchGameState({ type: 'BATTLE/UPDATE', payload: result.nextGameState });
    setMapProgress(result.nextMapProgress);
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
      setActiveTab('map');
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog, dispatchGameState, setMapProgress, setFocusMapNode, setActiveTab]);

  const handleBattleRetreat = useCallback(() => {
    const result = runBattleRetreat(gameState, mapProgress, MAP_CHAPTERS);
    dispatchGameState({ type: 'BATTLE/RETREAT', payload: result.nextGameState });
    setMapProgress(result.nextMapProgress);
    setActiveTab('map');
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog, dispatchGameState, setMapProgress, setFocusMapNode, setActiveTab]);

  const handleBattleCloseResult = useCallback(() => {
    const result = closeBattleResult(gameState);
    dispatchGameState({ type: 'BATTLE/CLOSE_RESULT', payload: result.nextGameState });
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
    }
    setActiveTab('map');
    result.logs.forEach(addLog);
  }, [gameState, addLog, dispatchGameState, setFocusMapNode, setActiveTab]);

  const handleBattleUseSkill = useCallback(
    (skillId: string, targetId?: string) => {
      const result = runBattlePlayerSkill(gameState, mapProgress, MAP_CHAPTERS, skillId, targetId);
      dispatchGameState({ type: 'BATTLE/UPDATE', payload: result.nextGameState });
      setMapProgress(result.nextMapProgress);
      if (result.focusNodeId) {
        setFocusMapNode(result.focusNodeId);
        setActiveTab('map');
      }
      result.logs.forEach(addLog);
    },
    [gameState, mapProgress, addLog, dispatchGameState, setMapProgress, setFocusMapNode, setActiveTab],
  );

  const handleEnterMapNode = useCallback(
    (
      node: Parameters<typeof startBattleSession>[2],
      chapter: Parameters<typeof startBattleSession>[1],
    ) => {
      const battle = startBattleSession(gameState, chapter, node);
      dispatchGameState({ type: 'BATTLE/START', payload: battle.nextGameState });
      battle.logs.forEach(addLog);
    },
    [gameState, addLog, dispatchGameState],
  );

  return {
    handleBattleAttack,
    handleBattleRetreat,
    handleBattleCloseResult,
    handleBattleUseSkill,
    handleEnterMapNode,
  } as const;
}
