export interface InventoryContext {
  quickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  handleEquip: (id: string) => void;
  handleSell: (id: string) => void;
  handleForge: (id: string) => void;
  handleReroll: (id: string, locks?: string[]) => void;
  handleUnequip: (slot: string) => void;
}