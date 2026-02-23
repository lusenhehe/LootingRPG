import type { Monster } from '../types/game';

// main.tsx already initializes i18n; keep this file pure and only import `t`
import { t } from 'i18next';

// load static configuration from JSON; names are handled via i18n keys
import monsterConfig from '../config/monsters.json';

// cast to any because JSON shape may include i18n keys that don't match Monster exactly
const { normal: rawNormal, boss: rawBoss } = monsterConfig as any;

// helper that converts optional key fields (labelKey, titleKey, etc) using t()
const localizeAdditionalFields = (m: any): any => {
  if (m.phases) {
    m.phases = m.phases.map((p: any) => ({
      ...p,
      label: p.labelKey ? t(p.labelKey) : p.label || '',
    }));
  }
  if (m.counterGoal) {
    m.counterGoal = {
      ...m.counterGoal,
      title: m.counterGoal.titleKey ? t(m.counterGoal.titleKey) : m.counterGoal.title,
      successText: m.counterGoal.successText ? t(m.counterGoal.successText) : m.counterGoal.successText,
      failText: m.counterGoal.failText ? t(m.counterGoal.failText) : m.counterGoal.failText,
    };
  }
  return m;
};

// attach translated name lazily
const addTranslatedName = (m: any): Monster => {
  // ensure icons array exists, fall back to single icon
  const icons = [] as string[];
  if (Array.isArray(m.icons)) icons.push(...m.icons);
  else if (m.icon) icons.push(m.icon);
  return {
    ...(localizeAdditionalFields(m) as Monster),
    icons,
    等级: Math.max(1, Number(m.等级) || 1),
    name: t(`monster.${m.id}`, { defaultValue: m.id ?? 'unknown_monster' }),
  } as Monster;
};

export const NORMAL_MONSTERS_DATA: Monster[] = rawNormal.map(addTranslatedName);
export const BOSS_MONSTERS_DATA: Monster[] = rawBoss.map(addTranslatedName);

// combined lookup table
const ALL_MONSTERS_DATA: Monster[] = [...NORMAL_MONSTERS_DATA, ...BOSS_MONSTERS_DATA];

/**
 * Find monster by id across normal and boss pools.
 */
export const getMonsterById = (id: string): Monster | undefined => {
  return ALL_MONSTERS_DATA.find((m) => m.id === id);
};

