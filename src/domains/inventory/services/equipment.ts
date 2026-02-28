import {
  QUALITIES,
  AFFIX_SCALING,
  AFFIX_COUNT_BY_QUALITY,
  ENCHANT_BASE_COST,
  ENCHANT_SCALE_BY_QUALITY,
  ENCHANT_COST_MULTIPLIER_BY_QUALITY,
} from '../../../config/game/equipment';
import { getEquipmentTemplates, type EquipmentTemplate } from '../../../config/game/equipment';
import type { Equipment, EquipmentAffix, EquipmentAffixValue } from '../../../shared/types/game';
import i18next from 'i18next';

const AFFIX_POOL: EquipmentAffix[] = ['crit_chance', 'lifesteal', 'damage_bonus', 'thorns', 'hp_bonus'];

const createAffix = (type: EquipmentAffix, qualityIndex: number): EquipmentAffixValue => {
  const idx = Math.min(Math.max(0, qualityIndex), QUALITIES.length - 1);
  const scaling = (AFFIX_SCALING as Record<string, number[]>)[type] ?? [];
  const value = scaling[idx] ?? 0;
  return { type, value };
};

const getLocaleKey = (): 'zh' | 'en' =>
  (i18next.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const inferMainStat = (attributes: Record<string, number>, slot: string): string => {
  const preferredBySlot = slot === 'weapon' ? 'attack' : slot === 'armor' || slot === 'helmet' ? 'hp' : 'defense';
  if (attributes[preferredBySlot] !== undefined) {
    return preferredBySlot;
  }

  const ranked = Object.entries(attributes).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || preferredBySlot;
};

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const buildFromTemplate = (template: EquipmentTemplate, playerLevel: number): Equipment => {
  const localeKey = getLocaleKey();
  const level = playerLevel + template.levelOffset;
  const scale = level * template.scalePerLevel;

  const attributes = Object.fromEntries(
    Object.entries(template.attributes).map(([key, value]) => [key, Math.round(value * scale)]),
  );

  const affixes = template.affixes.map((entry) => ({
    type: entry.type as EquipmentAffix,
    value: Math.round(entry.value * scale),
  }));

  const name = localeKey === 'zh' ? template.nameZh : template.nameEn;

  return {
    id: `${template.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    icon: template.icon,
    level,
    name,
    quality: template.quality,
    slot: template.slot,
    attributes,
    affixes,
    enhancementLevel: 0,
    mainStat: inferMainStat(attributes, template.slot),
    equipped: false,
    localeNames: {
      zh: template.nameZh,
      en: template.nameEn,
    },
  };
};

const normalizePity = (pity: { legendary: number; mythic: number }): { legendary: number; mythic: number } => ({
  legendary: Number(pity.legendary ?? 0),
  mythic: Number(pity.mythic ?? 0),
});

const pickTemplateOrThrow = (templates: EquipmentTemplate[]): EquipmentTemplate => {
  const selected = selectTemplate(templates);
  if (selected) return selected;

  if (templates.length === 0) {
    throw new Error('UniqueEquipments.csv has no valid rows.');
  }
  return pickRandom(templates);
};

const selectTemplate = (templates: EquipmentTemplate[]): EquipmentTemplate | null => {
  const eligible = templates;
  if (eligible.length === 0) return null;
  return pickRandom(eligible);
};

const pickFromDropDict = (
  templates: EquipmentTemplate[],
  dropdict?: Record<string, number>,
): EquipmentTemplate | null => {
  if (!dropdict) return null;

  const templateById = new Map(templates.map((template) => [template.id, template]));
  const candidates = Object.entries(dropdict)
    .map(([id, chance]) => ({ id, chance: Number(chance), template: templateById.get(id) }))
    .filter((entry) => entry.template && Number.isFinite(entry.chance) && entry.chance > 0) as Array<{
    id: string;
    chance: number;
    template: EquipmentTemplate;
  }>;

  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, entry) => sum + entry.chance, 0);
  let roll = Math.random() * total;

  for (const entry of candidates) {
    roll -= entry.chance;
    if (roll <= 0) return entry.template;
  }

  return candidates[candidates.length - 1].template;
};

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
  const kept = existing.filter((a) => lockTypes.includes(a.type));
  const needed = Math.max(0, (AFFIX_COUNT_BY_QUALITY[qIdx] ?? 0) - kept.length);
  const pool = AFFIX_POOL.filter((p) => !lockTypes.includes(p));
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
  monster: { monsterType?: 'normal' | 'elite' | 'boss'; dropdict?: Record<string, number> },
  pity: { legendary: number; mythic: number },
  playerLevel: number,
): { item: Equipment; newPity: { legendary: number; mythic: number } } => {
  const newPity = normalizePity(pity);
  newPity.legendary += 1;
  newPity.mythic += 1;

  const templates = getEquipmentTemplates();
  const selected = pickFromDropDict(templates, monster.dropdict) ?? pickTemplateOrThrow(templates);

  return {
    item: buildFromTemplate(selected, playerLevel),
    newPity,
  };
};

export const createCustomEquipment = (quality: string, slot: string, playerLevel = 1): Equipment => {
  const templates = getEquipmentTemplates().filter((template) => {
    if (template.slot !== slot) return false;
    if (template.quality !== quality) return false;
    return true;
  });

  const allTemplates = getEquipmentTemplates();
  const selected = templates.length > 0 ? pickRandom(templates) : pickTemplateOrThrow(allTemplates);

  return buildFromTemplate(selected, playerLevel);
};
