import { useState } from 'react';
import type { ActiveTab, MapProgressState } from '../../shared/types/game';
import { createInitialMapProgress } from '../../domains/map/services/progress';
import { MAP_CHAPTERS } from '../../config/map/ChapterData';

/**
 * 管理地图相关的 UI 状态：进度、选中标签及焦点节点
 */
export function useMapProgress() {
  const [mapProgress, setMapProgress] = useState<MapProgressState>(() =>
    createInitialMapProgress(MAP_CHAPTERS),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [focusMapNode, setFocusMapNode] = useState<string | null>(null);

  return {
    mapProgress,
    setMapProgress,
    activeTab,
    setActiveTab,
    focusMapNode,
    setFocusMapNode,
  } as const;
}
