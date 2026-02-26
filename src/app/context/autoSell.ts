export interface AutoSellContext {
  autoSellQualities: Record<string, boolean>;
  handleToggleAutoSellQuality: (quality: string) => void;
  setAutoSellQualities: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}