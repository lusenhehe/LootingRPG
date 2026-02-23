import { useEffect, useRef, useState } from 'react';
import type { MapProgressState, MapNode } from '../../types/map';
import {
  createInitialMapProgress,
  getCurrentMapNode,
  normalizeMapProgress,
  registerMapNodeFailure,
  registerMapNodeVictory,
} from '../../logic/mapProgress';

export function useMapProgress(initial?: MapProgressState) {
  const [mapProgress, setMapProgress] = useState<MapProgressState>(
    initial ? normalizeMapProgress(initial) : createInitialMapProgress(),
  );
  const mapProgressRef = useRef<MapProgressState>(mapProgress);

  useEffect(() => {
    mapProgressRef.current = mapProgress;
  }, [mapProgress]);

  const markVictory = (nodeId: string) => {
    const result = registerMapNodeVictory(mapProgressRef.current, nodeId);
    mapProgressRef.current = result.next;
    setMapProgress(result.next);
    return result;
  };

  const markFailure = (nodeId: string) => {
    const result = registerMapNodeFailure(mapProgressRef.current, nodeId);
    mapProgressRef.current = result;
    setMapProgress(result);
    return result;
  };

  const currentNode = (): MapNode | null => getCurrentMapNode(mapProgress);

  return {
    mapProgress,
    setMapProgress,
    markVictory,
    markFailure,
    currentNode,
  };
}
