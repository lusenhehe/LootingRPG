import type { MapChapterDef } from './adapters/mapChapterAdapter';
import type { MapProgressState } from '../types/game';

export const createInitialMapProgress = (chapters: MapChapterDef[]): MapProgressState => {
  const firstChapter = chapters[0];
  const firstNode = firstChapter?.nodes[0];

  return {
    selectedChapterId: firstChapter?.id ?? 'chapter-1',
    unlockedChapters: firstChapter ? [firstChapter.id] : [],
    unlockedNodes: firstNode ? [firstNode.id] : [],
    clearedNodes: [],
    failedAttempts: {},
  };
};

export const normalizeMapProgress = (
  progress: MapProgressState | undefined,
  chapters: MapChapterDef[],
): MapProgressState => {
  const base = createInitialMapProgress(chapters);
  if (!progress) return base;

  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const nodeIds = new Set(chapters.flatMap((chapter) => chapter.nodes.map((node) => node.id)));

  const unlockedChapters = Array.from(new Set(progress.unlockedChapters ?? [])).filter((id) => chapterIds.has(id));
  if (base.unlockedChapters.length > 0 && unlockedChapters.length === 0) {
    unlockedChapters.push(base.unlockedChapters[0]);
  }

  const unlockedNodes = Array.from(new Set(progress.unlockedNodes ?? [])).filter((id) => nodeIds.has(id));
  base.unlockedNodes.forEach((id) => {
    if (!unlockedNodes.includes(id)) unlockedNodes.push(id);
  });

  const clearedNodes = Array.from(new Set(progress.clearedNodes ?? [])).filter((id) => nodeIds.has(id));

  const failedAttempts: Record<string, number> = {};
  Object.entries(progress.failedAttempts ?? {}).forEach(([nodeId, attempts]) => {
    if (!nodeIds.has(nodeId)) return;
    failedAttempts[nodeId] = Math.max(0, Number(attempts) || 0);
  });

  const selectedChapterId = chapterIds.has(progress.selectedChapterId)
    ? progress.selectedChapterId
    : (unlockedChapters[0] ?? base.selectedChapterId);

  return {
    selectedChapterId,
    unlockedChapters,
    unlockedNodes,
    clearedNodes,
    failedAttempts,
  };
};

export const isChapterUnlocked = (progress: MapProgressState, chapterId: string) =>
  progress.unlockedChapters.includes(chapterId);

export const isNodeUnlocked = (progress: MapProgressState, nodeId: string) =>
  progress.unlockedNodes.includes(nodeId);

export const isNodeCleared = (progress: MapProgressState, nodeId: string) =>
  progress.clearedNodes.includes(nodeId);

export const getNodeAttempts = (progress: MapProgressState, nodeId: string) =>
  progress.failedAttempts[nodeId] ?? 0;

export const getChapterProgress = (
  progress: MapProgressState,
  chapter: MapChapterDef,
): { cleared: number; total: number; completed: boolean } => {
  const total = chapter.nodes.length;
  const cleared = chapter.nodes.reduce((acc, node) => acc + (isNodeCleared(progress, node.id) ? 1 : 0), 0);
  return {
    cleared,
    total,
    completed: total > 0 && cleared === total,
  };
};

interface ApplyNodeResultInput {
  progress: MapProgressState;
  chapters: MapChapterDef[];
  chapterId: string;
  nodeId: string;
  won: boolean;
}

export interface ApplyNodeResultOutput {
  nextProgress: MapProgressState;
  firstClear: boolean;
  unlockedNodeId?: string;
  unlockedChapterId?: string;
  chapterCompleted: boolean;
}

export const applyMapNodeResult = ({ progress, chapters, chapterId, nodeId, won }: ApplyNodeResultInput): ApplyNodeResultOutput => {
  const nextProgress = normalizeMapProgress(progress, chapters);

  if (!won) {
    nextProgress.failedAttempts[nodeId] = (nextProgress.failedAttempts[nodeId] ?? 0) + 1;
    return {
      nextProgress,
      firstClear: false,
      chapterCompleted: false,
    };
  }

  const firstClear = !nextProgress.clearedNodes.includes(nodeId);
  if (firstClear) {
    nextProgress.clearedNodes.push(nodeId);
  }

  if (!nextProgress.unlockedNodes.includes(nodeId)) {
    nextProgress.unlockedNodes.push(nodeId);
  }

  if (nextProgress.failedAttempts[nodeId]) {
    delete nextProgress.failedAttempts[nodeId];
  }

  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const chapter = chapterIndex >= 0 ? chapters[chapterIndex] : undefined;
  const nodeIndex = chapter?.nodes.findIndex((node) => node.id === nodeId) ?? -1;

  let unlockedNodeId: string | undefined;
  let unlockedChapterId: string | undefined;

  if (chapter && nodeIndex >= 0) {
    const nextNode = chapter.nodes[nodeIndex + 1];
    if (nextNode && !nextProgress.unlockedNodes.includes(nextNode.id)) {
      nextProgress.unlockedNodes.push(nextNode.id);
      unlockedNodeId = nextNode.id;
    }

    const chapterCompleted = chapter.nodes.every((node) => nextProgress.clearedNodes.includes(node.id));
    if (chapterCompleted) {
      const nextChapter = chapters[chapterIndex + 1];
      if (nextChapter && !nextProgress.unlockedChapters.includes(nextChapter.id)) {
        nextProgress.unlockedChapters.push(nextChapter.id);
        unlockedChapterId = nextChapter.id;
        const nextChapterFirstNode = nextChapter.nodes[0];
        if (nextChapterFirstNode && !nextProgress.unlockedNodes.includes(nextChapterFirstNode.id)) {
          nextProgress.unlockedNodes.push(nextChapterFirstNode.id);
          if (!unlockedNodeId) {
            unlockedNodeId = nextChapterFirstNode.id;
          }
        }
      }
    }

    return {
      nextProgress,
      firstClear,
      unlockedNodeId,
      unlockedChapterId,
      chapterCompleted,
    };
  }

  return {
    nextProgress,
    firstClear,
    unlockedNodeId,
    unlockedChapterId,
    chapterCompleted: false,
  };
};
