/**
 * @deprecated 迁移过渡层：请优先从 `src/domains/map/services/progress.ts` 引用。
 */
export type { ApplyNodeResultOutput } from '../domains/map/services/progress';

/**
 * @deprecated 迁移过渡层：请优先从 `src/domains/map/services/progress.ts` 引用。
 */
export {
  createInitialMapProgress,
  normalizeMapProgress,
  isChapterUnlocked,
  getNextNode,
  getNextChapter,
  isNodeUnlocked,
  isNodeCleared,
  getNodeAttempts,
  getChapterProgress,
  applyMapNodeResult,
} from '../domains/map/services/progress';
