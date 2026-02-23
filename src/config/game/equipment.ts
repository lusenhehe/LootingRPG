import qualities from './qualities.json';
import slots from './slots.json';
import statPool from './statPool.json';
import qualityConfig from './qualityConfig.json';

export const QUALITIES: string[] = qualities as string[];
export const SLOTS: string[] = slots as string[];
export const STAT_POOL: string[] = statPool as string[];

export const QUALITY_CONFIG: Record<string, { stats: number; price: number; color: string; iconName: string }> =
  qualityConfig as any;

export const getQualityColor = (quality: string): string => {
  return QUALITY_CONFIG[quality]?.color || 'text-gray-400';
};
