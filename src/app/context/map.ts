import type { MapProgressState, ActiveTab } from '../../types/game';

export interface MapContext {
  mapProgress: MapProgressState;
  setMapProgress: React.Dispatch<React.SetStateAction<MapProgressState>>;
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  focusMapNode: string | null;
  setFocusMapNode: React.Dispatch<React.SetStateAction<string | null>>;
}