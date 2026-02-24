import equipment from './equipment.json';

type QualityConfigItem = { stats: number; price: number; color: string; iconName: string };
type SlotItem = { id: string; name: string; icon: string };

const EQUIP: any = equipment as any;

export const STAT_POOL: string[] = EQUIP.statPool as string[];
export const QUALITIES: string[] = EQUIP.qualities as string[];
export const SLOTS: string[] = (EQUIP.slots as SlotItem[]).map(s => s.id);
export const SLOT_CONFIG: Record<string, SlotItem> = (EQUIP.slots as SlotItem[]).reduce((acc: any, s: SlotItem) => {
  acc[s.id] = s;
  return acc;
}, {});

export const QUALITY_CONFIG: Record<string, QualityConfigItem> = EQUIP.qualityConfig as Record<string, QualityConfigItem>;

export const getQualityColor = (quality: string): string => {
  return QUALITY_CONFIG[quality]?.color || 'text-gray-400';
};

export const AFFIX_SCALING: Record<string, number[]> = EQUIP.affixScaling as Record<string, number[]>;
export const AFFIX_COUNT_BY_QUALITY: number[] = EQUIP.affixCountByQuality as number[];
export const BASE_MULTIPLIER_BY_QUALITY: number[] = EQUIP.baseMultiplierByQuality as number[];

export const SLOT_BASE_NAMES: Record<string, string[]> = EQUIP.slotBaseNames as Record<string, string[]>;
export const SLOT_ICON_POOL: Record<string, string[]> = EQUIP.slotIconPool as Record<string, string[]>;
export const NAME_PREFIXES: string[] = EQUIP.namePrefixes as string[];
export const NAME_SUFFIXES: string[] = EQUIP.nameSuffixes as string[];
export const ENCHANT_CONFIG: any = EQUIP.enchantConfig as any;
export const ENCHANT_BASE_COST: number = ENCHANT_CONFIG?.enchantBaseCost ?? 500;
export const REROLL_BASE_COST: number = ENCHANT_CONFIG?.rerollBaseCost ?? 300;
export const LOCK_COST: number = ENCHANT_CONFIG?.lockCost ?? 200;
export const ENCHANT_SCALE_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantScaleByQuality ?? [0.05, 0.06, 0.07, 0.08, 0.10, 0.12];
export const ENCHANT_COST_MULTIPLIER_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantCostMultiplierByQuality ?? [1,1,1.05,1.1,1.25,1.5];
