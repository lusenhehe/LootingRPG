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
const addTranslatedName = (m: any): Monster => ({
  ...(localizeAdditionalFields(m) as Monster),
  等级: Math.max(1, Number(m.等级) || 1),
  name: t(`monster.${m.id}`, { defaultValue: m.id ?? 'unknown_monster' }),
});

export const NORMAL_MONSTERS_DATA: Monster[] = rawNormal.map(addTranslatedName);
export const BOSS_MONSTERS_DATA: Monster[] = rawBoss.map(addTranslatedName);

