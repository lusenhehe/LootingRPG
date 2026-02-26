import { createContext, useContext } from 'react';
import type { MapProgressState, ActiveTab } from '../../types/game';

export interface MapContextValue {
  mapProgress: MapProgressState;
  setMapProgress: React.Dispatch<React.SetStateAction<MapProgressState>>;
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  focusMapNode: string | null;
  setFocusMapNode: React.Dispatch<React.SetStateAction<string | null>>;
}

export const MapContext = createContext<MapContextValue | undefined>(undefined);

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMapContext must be used within a GameProvider');
  }
  return ctx;
}