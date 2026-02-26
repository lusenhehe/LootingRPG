export interface BattleContext {
  handleEnterMapNode: (
    node: import('../../config/map/ChapterData').MapNodeDef,
    chapter: import('../../config/map/ChapterData').MapChapterDef,
  ) => void;
  handleBattleAttack: () => void;
  handleBattleRetreat: () => void;
}