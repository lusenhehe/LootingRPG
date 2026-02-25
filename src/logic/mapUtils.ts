import type { MapNodeDef} from '../config/map/ChapterData';
import {MAP_CHAPTERS} from '../config/map/ChapterData';
export const getMapNodeById = (nodeId: string): MapNodeDef | undefined => {
  for (const chapter of MAP_CHAPTERS) {
    const found = chapter.nodes.find((node) => node.id === nodeId);
    if (found) return found;
  }
  return undefined;
};
