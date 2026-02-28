// 本模块合并了原来的两个配置文件：
// - `data/config/game/equipment.json`：包含装备相关的静态配置数据，如属性池、品质配置、槽位信息等。
// - `data/config/game/equipments.csv`：包含装备模板数据，用于从 CSV 导入自定义装备。CSV 解析工具也在此模块中实现并导出。
// 所有导出内容包括基础配置常量、配色、价格信息
// 以及为了调试/加载自定义装备而使用的 CSV 解析工具。

import equipment from '@data/config/game/equipment.json';
import csvRaw from '@data/config/game/equipments.csv?raw';

type QualityConfigItem = { stats: number; price: number; color: string; iconName: string };
type SlotItem = { id: string; name: string; icon: string };
type EnchantConfig = {
  enchantBaseCost?: number;
  rerollBaseCost?: number;
  lockCost?: number;
  enchantScaleByQuality?: number[];
  enchantCostMultiplierByQuality?: number[];
};
type EquipDataSchema = {
  statPool: string[];
  qualities: string[];
  slots: SlotItem[];
  qualityConfig: Record<string, QualityConfigItem>;
  affixCountByQuality: number[];
  baseMultiplierByQuality: number[];
  affixScaling: Record<string, number[]>;
  enchantConfig?: EnchantConfig;
};

// 从 JSON 文件中加载装备静态配置数据
const EquipData = equipment as unknown as EquipDataSchema;

// 可用属性池（词条类型）
export const STAT_POOL: string[] = EquipData.statPool;
// 装备品质列表
export const QUALITIES: string[] = EquipData.qualities;
// 装备槽位 id 数组
export const SLOTS: string[]     = EquipData.slots.map(s => s.id);
// 槽位详细配置，便于通过 id 查找名称和图标
export const SLOT_CONFIG: Record<string, SlotItem> = EquipData.slots.reduce<Record<string, SlotItem>>((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});
// 品质配置，包含基础属性加成、价格、颜色、图标等
export const QUALITY_CONFIG: Record<string, QualityConfigItem> = EquipData.qualityConfig as Record<string, QualityConfigItem>;
export const getQualityColor = (quality: string): string => {return QUALITY_CONFIG[quality]?.color};
// 每个品质可拥有的词条数、基础倍率
export const AFFIX_COUNT_BY_QUALITY: number[]     = EquipData.affixCountByQuality;
export const BASE_MULTIPLIER_BY_QUALITY: number[] = EquipData.baseMultiplierByQuality;
// 附魔相关配置
export const ENCHANT_CONFIG: EnchantConfig = EquipData.enchantConfig ?? {};
/// 价格相关
export const ENCHANT_BASE_COST: number = ENCHANT_CONFIG?.enchantBaseCost ?? 500;
export const REROLL_BASE_COST: number  = ENCHANT_CONFIG?.rerollBaseCost ?? 300;
export const LOCK_COST: number         = ENCHANT_CONFIG?.lockCost ?? 200;
/// 比率
export const AFFIX_SCALING: Record<string, number[]> = EquipData.affixScaling;
export const ENCHANT_SCALE_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantScaleByQuality ?? [0.05, 0.06, 0.07, 0.08, 0.10, 0.12];
export const ENCHANT_COST_MULTIPLIER_BY_QUALITY: number[] = ENCHANT_CONFIG?.enchantCostMultiplierByQuality ?? [1,1,1.05,1.1,1.25,1.5];


// 以下为原来的 `src/config/content/equipments.ts` 内容，
// 已与本文件合并，此文件现在负责装备静态配置以及
// 从 CSV 导入装备模板的功能。
// 原文件被弃用，相关引用已迁移到本模块。

/**
 * 装备模板接口，描述 CSV 中每一行的结构。
 * 包含基础槽位、品质、图标、名称、属性、词条以及
 * 等级缩放等生成装备所需的信息。
 */
export interface EquipmentTemplate {
  id: string;
  slot: string;
  quality: string;
  icon: string;
  nameZh: string;
  nameEn: string;
  /** 装备专属描述文本（中文），展示于物品卡片 */
  descriptionZh: string;
  /** 装备专属描述文本（英文），展示于物品卡片 */
  descriptionEn: string;
  attributes: Record<string, number>;
  affixes: Array<{ type: string; value: number }>;
  levelOffset: number;
  scalePerLevel: number;
}

// 以下是 CSV 解析工具函数，用于将字符串转换为 JSON 对象或词条数组。
const parseJsonObject = (value: string): Record<string, number> => {
  if (!value.trim()) return {};
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const result: Record<string, number> = {};
  Object.entries(parsed as Record<string, unknown>).forEach(([key, raw]) => {
    const numberValue = Number(raw);
    if (Number.isFinite(numberValue)) {
      result[key] = numberValue;
    }
  });
  return result;
};
const parseAffixes = (value: string): Array<{ type: string; value: number }> => {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const isAffixEntry = (entry: unknown): entry is { type?: unknown; value?: unknown } => {
      return typeof entry === 'object' && entry !== null;
    };

    return parsed
      .map((entry) => {
        if (!isAffixEntry(entry)) {
          return { type: '', value: NaN };
        }
        return {
          type: String(entry.type ?? '').trim(),
          value: Number(entry.value ?? 0),
        };
      })
      .filter((entry) => entry.type.length > 0 && Number.isFinite(entry.value));
  } catch {
    return [];
  }
};

// CSV 行解析器，支持带双引号的单元格和转义。
const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const ch = line[index];
    const next = line[index + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
};

let cachedTemplates: EquipmentTemplate[] | null = null;

/**
 * 从 embedded CSV 文本中读取装备模板并缓存。
 * csvRaw 由 Vite 的 `?raw` 导入提供。
 */
export const getEquipmentTemplates = (): EquipmentTemplate[] => {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  // 使用文件顶部导入的原始 CSV 文本
  //（Vite 的 `?raw` 保证为字符串）。
  //const csvRaw: string = require('./content/equipments.csv?raw');

  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (lines.length <= 1) {
    cachedTemplates = [];
    return [];
  }

  const header = parseCsvLine(lines[0]);

  const templates = lines.slice(1).map((line: string, rowIndex: number) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? '';
    });

    const id = row.id?.trim() || `csv_item_${rowIndex + 1}`;
    return {
      id,
      slot:    row.slot?.trim()    || 'Error',
      quality: row.quality?.trim() || 'Error',
      icon:    row.icon?.trim()    || 'Error',
      nameZh:    row.name_zh?.trim()    || row.name_en?.trim()    || `装备${id}`,
      nameEn:    row.name_en?.trim()    || row.name_zh?.trim()    || `装备${id}`,
      descriptionZh: row.description_zh?.trim() || row.description_en?.trim() || '',
      descriptionEn: row.description_en?.trim() || row.description_zh?.trim() || '',
      attributes: parseJsonObject(row.attributes || ''),
      affixes:    parseAffixes(row.affixes || ''),
      levelOffset: Math.floor(Number(row.levelOffset) || 0),
      scalePerLevel:  Number(row.scalePerLevel) || 0,
    } satisfies EquipmentTemplate;
  });

  cachedTemplates = templates;
  return templates;
};
