import equipment from './equipment.json';

type QualityConfigItem = { stats: number; price: number; color: string; iconName: string };
type SlotItem = { id: string; name: string; icon: string };

const EquipData: any = equipment as any;

export const STAT_POOL: string[] = EquipData.statPool;
export const QUALITIES: string[] = EquipData.qualities;
export const SLOTS: string[]     = (EquipData.slots as SlotItem[]).map(s => s.id);
export const SLOT_CONFIG: Record<string, SlotItem> = (EquipData.slots as SlotItem[]).reduce((acc: any, s: SlotItem) => { acc[s.id] = s; return acc;}, {});
export const QUALITY_CONFIG: Record<string, QualityConfigItem> = EquipData.qualityConfig as Record<string, QualityConfigItem>;
export const getQualityColor = (quality: string): string => {return QUALITY_CONFIG[quality]?.color};
export const AFFIX_COUNT_BY_QUALITY: number[]     = EquipData.affixCountByQuality;
export const BASE_MULTIPLIER_BY_QUALITY: number[] = EquipData.baseMultiplierByQuality;
export const ENCHANT_CONFIG: any       = EquipData.enchantConfig as any;
/// 价格相关
export const ENCHANT_BASE_COST: number = ENCHANT_CONFIG?.enchantBaseCost ?? 500;
export const REROLL_BASE_COST: number  = ENCHANT_CONFIG?.rerollBaseCost ?? 300;
export const LOCK_COST: number         = ENCHANT_CONFIG?.lockCost ?? 200;
/// 比率
export const AFFIX_SCALING: Record<string, number[]> = EquipData.affixScaling;
export const ENCHANT_SCALE_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantScaleByQuality ?? [0.05, 0.06, 0.07, 0.08, 0.10, 0.12];
export const ENCHANT_COST_MULTIPLIER_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantCostMultiplierByQuality ?? [1,1,1.05,1.1,1.25,1.5];
