import { createContext, useContext } from 'react';

export interface BattleContextValue {
  handleEnterMapNode: (
    node: import('../../config/map/ChapterData').MapNodeDef,
    chapter: import('../../config/map/ChapterData').MapChapterDef,
  ) => void;
  handleBattleAttack: () => void;
  handleBattleRetreat: () => void;
  handleBattleUseSkill: (skillId: string) => void;
}

export const BattleContext = createContext<BattleContextValue | undefined>(undefined);

export function useBattleContext(): BattleContextValue {
  const ctx = useContext(BattleContext);
  if (!ctx) {
    throw new Error('useBattleContext must be used within a GameProvider');
  }
  return ctx;
}