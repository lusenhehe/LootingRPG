import { QUALITIES, SLOTS, AFFIX_SCALING, AFFIX_COUNT_BY_QUALITY, SLOT_ICON_POOL, ENCHANT_BASE_COST, ENCHANT_SCALE_BY_QUALITY, ENCHANT_COST_MULTIPLIER_BY_QUALITY, REROLL_BASE_COST, LOCK_COST } from '../config/game/equipment';
import { getUniqueEquipmentTemplates, type UniqueEquipmentTemplate } from '../config/content/uniqueEquipments';
import type { Equipment, EquipmentAffix, EquipmentAffixValue } from '../types/game';
import i18next from 'i18next';

const AFFIX_POOL: EquipmentAffix[] = ['crit_chance', 'lifesteal', 'damage_bonus', 'thorns', 'hp_bonus'];

const createAffix = (type: EquipmentAffix, qualityIndex: number): EquipmentAffixValue => {
  const idx = Math.min(Math.max(0, qualityIndex), QUALITIES.length - 1);
  const scaling = (AFFIX_SCALING as Record<string, number[]>)[type] ?? [];
  const value = scaling[idx] ?? 0;
  return { type, value };
};

const createAffixes = (quality: string, isBoss: boolean): EquipmentAffixValue[] => {
  const qualityIndex = Math.max(0, QUALITIES.indexOf(quality));
  const countBase = (AFFIX_COUNT_BY_QUALITY && AFFIX_COUNT_BY_QUALITY[qualityIndex]) ?? 0;
  const count = Math.max(0, countBase + (isBoss && qualityIndex >= 2 ? 1 : 0));

  const pool = [...AFFIX_POOL];
  const affixes: EquipmentAffixValue[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const affixType = pool.splice(index, 1)[0];
    affixes.push(createAffix(affixType, qualityIndex));
  }

  return affixes;
};

export const getDefaultEquipmentIcon = (slot: string): string => {
  const pool = SLOT_ICON_POOL[slot] ?? ['🧰'];
  return pool[Math.floor(Math.random() * pool.length)] ?? '🧰';
};

const getLocaleKey = (): 'zh' | 'en' => (i18next.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const inferMainStat = (attributes: Record<string, number>, slot: string): string => {
  const preferredBySlot = slot === 'weapon' ? 'attack' : slot === 'armor' || slot === 'helmet' ? 'hp' : 'defense';
  if (attributes[preferredBySlot] !== undefined) {
    return preferredBySlot;
  }

  const ranked = Object.entries(attributes).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || preferredBySlot;
};

const pickWeighted = <T,>(list: T[], weightGetter: (item: T) => number): T => {
  const total = list.reduce((sum, item) => sum + Math.max(0.01, weightGetter(item)), 0);
  let threshold = Math.random() * total;
  for (const item of list) {
    threshold -= Math.max(0.01, weightGetter(item));
    if (threshold <= 0) {
      return item;
    }
  }
  return list[list.length - 1];
};

const buildFromTemplate = (template: UniqueEquipmentTemplate, playerLevel: number): Equipment => {
  const localeKey = getLocaleKey();
  const level = Math.max(1, playerLevel + template.levelOffset);
  const scale = 1 + Math.max(0, level - 1) * Math.max(0, template.scalePerLevel);

  const attributes = Object.fromEntries(
    Object.entries(template.attributes).map(([key, value]) => [key, Math.max(0, Math.round(value * scale))]),
  );

  const affixes = template.affixes.map((entry) => ({
    type: entry.type as EquipmentAffix,
    value: Math.max(0, Math.round(entry.value * scale)),
  }));

  const name = localeKey === 'zh' ? template.nameZh : template.nameEn;
  const special = localeKey === 'zh' ? template.specialZh : template.specialEn;

  return {
    id: `${template.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    icon: template.icon || getDefaultEquipmentIcon(template.slot),
    level,
    name,
    quality: template.quality,
    slot: template.slot,
    attributes,
    affixes,
    enhancementLevel: 0,
    mainStat: inferMainStat(attributes, template.slot),
    equipped: false,
    special,
    localeNames: {
      zh: template.nameZh,
      en: template.nameEn,
    },
  };
};

const normalizePity = (pity: { legendary: number; mythic: number }): { legendary: number; mythic: number } => {
  const copy = { ...pity } as any;
  if (copy.神话 !== undefined && copy.mythic === undefined) copy.mythic = copy.神话;
  if (copy.传说 !== undefined && copy.legendary === undefined) copy.legendary = copy.传说;
  return {
    legendary: Number(copy.legendary ?? 0),
    mythic: Number(copy.mythic ?? 0),
  };
};

const pickTemplateOrThrow = (
  templates: UniqueEquipmentTemplate[],
  context: { isBoss: boolean; playerLevel: number; mapNodeId?: string },
): UniqueEquipmentTemplate => {
  const selected = selectTemplate(templates, context);
  if (selected) return selected;

  if (templates.length === 0) {
    throw new Error('UniqueEquipments.csv has no valid rows.');
  }

  const byLevel = templates.filter((template) => (
    template.minLevel <= context.playerLevel && template.maxLevel >= context.playerLevel
  ));

  const byBoss = byLevel.filter((template) => !template.bossOnly || context.isBoss);
  const pool = byBoss.length > 0 ? byBoss : (byLevel.length > 0 ? byLevel : templates);
  return pickWeighted(pool, (item) => item.weight);
};

const selectTemplate = (
  templates: UniqueEquipmentTemplate[],
  context: { isBoss: boolean; playerLevel: number; mapNodeId?: string },
): UniqueEquipmentTemplate | null => {
  const eligible = templates.filter((template) => {
    if (template.bossOnly && !context.isBoss) return false;
    if (template.mapNode && context.mapNodeId && template.mapNode !== context.mapNodeId) return false;
    if (template.minLevel > context.playerLevel) return false;
    if (template.maxLevel < context.playerLevel) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const rolled = eligible.filter((template) => Math.random() <= template.chance);
  const pool = rolled.length > 0 ? rolled : eligible;
  return pickWeighted(pool, (item) => item.weight);
};

// ----- Enchant / Reroll helpers -----

export const calculateEnchantCost = (item: Equipment): number => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
  const base = ENCHANT_BASE_COST;
  const mult = ENCHANT_COST_MULTIPLIER_BY_QUALITY[qIdx] ?? 1;
  return Math.max(0, Math.floor(base * (item.enhancementLevel + 1) * mult));
};

export const previewEnchant = (item: Equipment, times = 1): Equipment => {
  const copy: Equipment = structuredClone(item);
  const qIdx = Math.max(0, QUALITIES.indexOf(copy.quality));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  for (let i = 0; i < times; i++) {
    copy.enhancementLevel = (copy.enhancementLevel || 0) + 1;
    Object.entries(copy.attributes).forEach(([k, v]) => {
      copy.attributes[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
    });
    // scale affix values as well
    if (Array.isArray(copy.affixes)) {
      copy.affixes = copy.affixes.map((a) => ({
        type: a.type,
        value: Math.max(0, Math.round(a.value * (1 + scale))),
      }));
    }
  }
  return copy;
};

export const applyEnchant = (item: Equipment): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  item.enhancementLevel = (item.enhancementLevel || 0) + 1;
  Object.entries(item.attributes).forEach(([k, v]) => {
    item.attributes[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
  });
  // scale affix values as well
  if (Array.isArray(item.affixes)) {
    item.affixes = item.affixes.map((a) => ({
      type: a.type,
      value: Math.max(0, Math.round(a.value * (1 + scale))),
    }));
  }
  return item;
};

export const rerollAffixes = (item: Equipment, options?: { lockTypes?: string[] }): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
  const lockTypes = options?.lockTypes ?? [];
  const existing = Array.isArray(item.affixes) ? item.affixes.slice() : [];
  const kept = existing.filter(a => lockTypes.includes(a.type));
  const needed = Math.max(0, (AFFIX_COUNT_BY_QUALITY[qIdx] ?? 0) - kept.length);
  const pool = AFFIX_POOL.filter(p => !lockTypes.includes(p));
  const newAffixes: EquipmentAffixValue[] = [];
  for (let i = 0; i < needed && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const type = pool.splice(idx, 1)[0];
    newAffixes.push(createAffix(type as EquipmentAffix, qIdx));
  }
  item.affixes = [...kept, ...newAffixes];
  return item;
};

export const generateEquipment = (
  isBoss: boolean,
  pity: { legendary: number; mythic: number },
  playerLevel: number,
): { item: Equipment; newPity: { legendary: number; mythic: number } } => {
  const newPity = normalizePity(pity);
  newPity.legendary += 1;
  newPity.mythic += 1;

  const templates = getUniqueEquipmentTemplates();
  const selected = pickTemplateOrThrow(templates, { isBoss, playerLevel });
  return {
    item: buildFromTemplate(selected, playerLevel),
    newPity,
  };
};

export const createCustomEquipment = (
  quality: string,
  slot: string,
  playerLevel = 1,
  isBoss = false,
): Equipment => {
  const templates = getUniqueEquipmentTemplates().filter((template) => {
    if (template.slot !== slot) return false;
    if (template.quality !== quality) return false;
    if (template.bossOnly && !isBoss) return false;
    return true;
  });

  const allTemplates = getUniqueEquipmentTemplates();
  const selected = templates.length > 0
    ? pickWeighted(templates, (item) => item.weight)
    : pickTemplateOrThrow(allTemplates, { isBoss, playerLevel });

  return buildFromTemplate(selected, playerLevel);
};
