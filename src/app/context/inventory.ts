import { createContext, useContext } from 'react';

export interface InventoryContextValue {
  quickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  handleEquip: (id: string) => void;
  handleSell: (id: string) => void;
  handleForge: (id: string) => void;
  handleReroll: (id: string, locks?: string[]) => void;
  handleUnequip: (slot: string) => void;
}

export const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function useInventoryContext(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventoryContext must be used within a GameProvider');
  }
  return ctx;
}