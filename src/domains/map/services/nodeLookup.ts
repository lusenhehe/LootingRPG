import type { MapNodeDef } from '../model/chapters';
import { MAP_CHAPTERS } from '../model/chapters';

export const getMapNodeById = (nodeId: string): MapNodeDef | undefined => {
  for (const chapter of MAP_CHAPTERS) {
    const found = chapter.nodes.find((node) => node.id === nodeId);
    if (found) return found;
  }
  return undefined;
};
