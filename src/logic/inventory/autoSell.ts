import { QUALITIES } from '../../config/game/equipment';

export const createAutoSellQualityMap = (): Record<string, boolean> => {
  return QUALITIES.reduce((acc, quality) => {
    acc[quality] = false;
    return acc;
  }, {} as Record<string, boolean>);
};
