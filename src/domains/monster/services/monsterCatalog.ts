import type { Monster } from '../../../types/game';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA } from '../config';
import i18n from '../../../i18n';

// attach lore / localization text to a monster object
export const attachMonsterLore = (monster: Monster): Monster => {
  const backgroundKey = monster.background;
  const background = backgroundKey ? i18n.t(backgroundKey) : i18n.t('codex.backgroundFallback');
  const rawBoss = monster.monsterType === 'boss' ? monster.bossIdentity : undefined;
  const rawBossRecord = rawBoss as unknown as Record<string, unknown> | undefined;
  const introLineKey = typeof rawBossRecord?.introLineKey === 'string' ? rawBossRecord.introLineKey : undefined;
  const battleLogLineKey = typeof rawBossRecord?.battleLogLineKey === 'string' ? rawBossRecord.battleLogLineKey : undefined;
  const bossIdentity = rawBoss
    ? {
        ...rawBoss,
        introLine: i18n.t(introLineKey || rawBoss.introLine || ''),
        battleLogLine: i18n.t(battleLogLineKey || rawBoss.battleLogLine || ''),
        phasePrompts: {
          entering: rawBoss.phasePrompts?.entering ? i18n.t(rawBoss.phasePrompts.entering) : '',
          fighting: rawBoss.phasePrompts?.fighting ? i18n.t(rawBoss.phasePrompts.fighting) : '',
          dying: rawBoss.phasePrompts?.dying ? i18n.t(rawBoss.phasePrompts.dying) : '',
          dropping: rawBoss.phasePrompts?.dropping ? i18n.t(rawBoss.phasePrompts.dropping) : '',
        },
      }
    : undefined;

  return { ...monster, background, bossIdentity };
};

export const NORMAL_MONSTERS: Monster[] = NORMAL_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
export const BOSS_MONSTERS: Monster[] = BOSS_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
