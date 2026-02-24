import mapData from './mapdata.json';
import { MapChapterDef } from './mapTypes';
export const MAP_CHAPTERS: MapChapterDef[] = (mapData as any).MAP_CHAPTERS || [];
