import { useCallback } from 'react';
import { runBattlePlayerAttack, runBattleRetreat, startBattleSession, runBattlePlayerSkill } from '../../domains/battle/services/session';
import { MAP_CHAPTERS } from '../../config/map/ChapterData';
import type { GameState, MapProgressState } from '../../shared/types/game';
import type { ActiveTab } from '../../shared/types/game';

interface UseBattleSessionParams {
  gameState: GameState;
  mapProgress: MapProgressState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
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
  setGameState,
  setMapProgress,
  addLog,
  setActiveTab,
  setFocusMapNode,
}: UseBattleSessionParams) {
  const handleBattleAttack = useCallback(() => {
    const result = runBattlePlayerAttack(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
      setActiveTab('map');
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog, setGameState, setMapProgress, setFocusMapNode, setActiveTab]);

  const handleBattleRetreat = useCallback(() => {
    const result = runBattleRetreat(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    setActiveTab('map');
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog, setGameState, setMapProgress, setFocusMapNode, setActiveTab]);

  const handleBattleUseSkill = useCallback(
    (skillId: string) => {
      const result = runBattlePlayerSkill(gameState, mapProgress, MAP_CHAPTERS, skillId);
      setGameState(result.nextGameState);
      setMapProgress(result.nextMapProgress);
      if (result.focusNodeId) {
        setFocusMapNode(result.focusNodeId);
        setActiveTab('map');
      }
      result.logs.forEach(addLog);
    },
    [gameState, mapProgress, addLog, setGameState, setMapProgress, setFocusMapNode, setActiveTab],
  );

  const handleEnterMapNode = useCallback(
    (
      node: Parameters<typeof startBattleSession>[2],
      chapter: Parameters<typeof startBattleSession>[1],
    ) => {
      const battle = startBattleSession(gameState, chapter, node);
      setGameState(battle.nextGameState);
      battle.logs.forEach(addLog);
    },
    [gameState, addLog, setGameState],
  );

  return {
    handleBattleAttack,
    handleBattleRetreat,  
    handleBattleUseSkill,
    handleEnterMapNode,
  } as const;
}
