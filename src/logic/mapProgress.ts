import { MAP_CHAPTERS, MAP_NODES } from '../config/mapProgression';
import type { MapNode, MapProgressState } from '../types/map';

const NODE_MAP = new Map<string, MapNode>(MAP_NODES.map((node) => [node.id, node]));

export const createInitialMapProgress = (): MapProgressState => ({
  currentNodeId: 'n1',
  unlockedNodeIds: ['n1'],
  clearedNodeIds: [],
  failedNodeIds: {},
  firstClearRewardClaimedIds: [],
});

export const getMapNode = (nodeId: string): MapNode | undefined => NODE_MAP.get(nodeId);

export const getCurrentMapNode = (progress: MapProgressState): MapNode | undefined => getMapNode(progress.currentNodeId);

export const getChapterByNode = (nodeId: string) => {
  const node = getMapNode(nodeId);
  if (!node) return undefined;
  return MAP_CHAPTERS.find((chapter) => chapter.id === node.chapterId);
};

export const normalizeMapProgress = (raw?: Partial<MapProgressState> | null): MapProgressState => {
  const initial = createInitialMapProgress();
  if (!raw) return initial;

  const currentNode = raw.currentNodeId && getMapNode(raw.currentNodeId) ? raw.currentNodeId : initial.currentNodeId;
  const unlockedNodeIds = (raw.unlockedNodeIds ?? []).filter((id) => Boolean(getMapNode(id)));
  const clearedNodeIds = (raw.clearedNodeIds ?? []).filter((id) => Boolean(getMapNode(id)));
  const firstClearRewardClaimedIds = (raw.firstClearRewardClaimedIds ?? []).filter((id) => Boolean(getMapNode(id)));

  return {
    currentNodeId: currentNode,
    unlockedNodeIds: Array.from(new Set([initial.currentNodeId, ...unlockedNodeIds])),
    clearedNodeIds: Array.from(new Set(clearedNodeIds)),
    failedNodeIds: raw.failedNodeIds ?? {},
    firstClearRewardClaimedIds: Array.from(new Set(firstClearRewardClaimedIds)),
  };
};

export const registerMapNodeFailure = (progress: MapProgressState, nodeId: string): MapProgressState => {
  const nextFailCount = (progress.failedNodeIds[nodeId] ?? 0) + 1;
  return {
    ...progress,
    failedNodeIds: {
      ...progress.failedNodeIds,
      [nodeId]: nextFailCount,
    },
  };
};

export const registerMapNodeVictory = (
  progress: MapProgressState,
  nodeId: string,
): { next: MapProgressState; firstClear: boolean; nextNode?: MapNode } => {
  const node = getMapNode(nodeId);
  if (!node) return { next: progress, firstClear: false };

  const alreadyCleared = progress.clearedNodeIds.includes(nodeId);
  const firstClear = !alreadyCleared;

  const unlocked = new Set(progress.unlockedNodeIds);
  node.nextNodeIds.forEach((id) => unlocked.add(id));

  const cleared = alreadyCleared ? progress.clearedNodeIds : [...progress.clearedNodeIds, nodeId];

  const nextNodeId = node.nextNodeIds.find((id) => unlocked.has(id)) ?? nodeId;
  const nextNode = getMapNode(nextNodeId);

  const rewardClaimed = firstClear
    ? [...progress.firstClearRewardClaimedIds, nodeId]
    : progress.firstClearRewardClaimedIds;

  return {
    firstClear,
    nextNode,
    next: {
      ...progress,
      currentNodeId: nextNodeId,
      unlockedNodeIds: Array.from(unlocked),
      clearedNodeIds: cleared,
      firstClearRewardClaimedIds: rewardClaimed,
    },
  };
};