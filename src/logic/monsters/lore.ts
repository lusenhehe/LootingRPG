import type { BossIdentity, Monster } from '../../types/game';
import i18n from '../../i18n';

export const MONSTER_BACKGROUNDS: Record<string, string> = {
  skeleton: 'monster.background.skeleton',
  zombie: 'monster.background.zombie',
  goblin: 'monster.background.goblin',
  wolf: 'monster.background.wolf',
  wraith: 'monster.background.wraith',
  slime: 'monster.background.slime',
  bandit: 'monster.background.bandit',
  cultist: 'monster.background.cultist',
  giant_rat: 'monster.background.giant_rat',
  stone_golem: 'monster.background.stone_golem',
  lava_hound: 'monster.background.lava_hound',
  poison_spider: 'monster.background.poison_spider',
  frost_mage: 'monster.background.frost_mage',
  harpy: 'monster.background.harpy',
  mimic: 'monster.background.mimic',
  void_eye: 'monster.background.void_eye',
  forest_satyr: 'monster.background.forest_satyr',
  shadow_assassin: 'monster.background.shadow_assassin',
  bone_shaman: 'monster.background.bone_shaman',
  iron_knight: 'monster.background.iron_knight',
  plague_doctor: 'monster.background.plague_doctor',
  storm_elemental: 'monster.background.storm_elemental',
  blood_bat: 'monster.background.blood_bat',
  sand_wraith: 'monster.background.sand_wraith',
  abyss_guard: 'monster.background.abyss_guard',
  thorn_beast: 'monster.background.thorn_beast',
  arcane_construct: 'monster.background.arcane_construct',
  grave_keeper: 'monster.background.grave_keeper',
  ashen_warlock: 'monster.background.ashen_warlock',
  crystal_lurker: 'monster.background.crystal_lurker',
  moon_huntress: 'monster.background.moon_huntress',
  rot_brute: 'monster.background.rot_brute',
  abyss_demon: 'monster.background.abyss_demon',
  ancient_dragon: 'monster.background.ancient_dragon',
  dark_knight: 'monster.background.dark_knight',
  necromancer: 'monster.background.necromancer',
  storm_titan: 'monster.background.storm_titan',
  scarlet_queen: 'monster.background.scarlet_queen',
  void_reaper: 'monster.background.void_reaper',
  clockwork_core: 'monster.background.clockwork_core',
};

export const BOSS_IDENTITIES: Record<string, BossIdentity> = {
  abyss_demon: {
    theme: 'abyss',
    introLine: 'boss.abyss_demon.introLine',
    battleLogLine: 'boss.abyss_demon.battleLogLine',
    phasePrompts: { entering: 'boss.abyss_demon.phase.entering', fighting: 'boss.abyss_demon.phase.fighting', dying: 'boss.abyss_demon.phase.dying', dropping: 'boss.abyss_demon.phase.dropping' },
  },
  ancient_dragon: {
    theme: 'dragonfire',
    introLine: 'boss.ancient_dragon.introLine',
    battleLogLine: 'boss.ancient_dragon.battleLogLine',
    phasePrompts: { entering: 'boss.ancient_dragon.phase.entering', fighting: 'boss.ancient_dragon.phase.fighting', dying: 'boss.ancient_dragon.phase.dying', dropping: 'boss.ancient_dragon.phase.dropping' },
  },
  dark_knight: {
    theme: 'iron',
    introLine: 'boss.dark_knight.introLine',
    battleLogLine: 'boss.dark_knight.battleLogLine',
    phasePrompts: { entering: 'boss.dark_knight.phase.entering', fighting: 'boss.dark_knight.phase.fighting', dying: 'boss.dark_knight.phase.dying', dropping: 'boss.dark_knight.phase.dropping' },
  },
  necromancer: {
    theme: 'necro',
    introLine: 'boss.necromancer.introLine',
    battleLogLine: 'boss.necromancer.battleLogLine',
    phasePrompts: { entering: 'boss.necromancer.phase.entering', fighting: 'boss.necromancer.phase.fighting', dying: 'boss.necromancer.phase.dying', dropping: 'boss.necromancer.phase.dropping' },
  },
  storm_titan: {
    theme: 'storm',
    introLine: 'boss.storm_titan.introLine',
    battleLogLine: 'boss.storm_titan.battleLogLine',
    phasePrompts: { entering: 'boss.storm_titan.phase.entering', fighting: 'boss.storm_titan.phase.fighting', dying: 'boss.storm_titan.phase.dying', dropping: 'boss.storm_titan.phase.dropping' },
  },
  scarlet_queen: {
    theme: 'blood',
    introLine: 'boss.scarlet_queen.introLine',
    battleLogLine: 'boss.scarlet_queen.battleLogLine',
    phasePrompts: { entering: 'boss.scarlet_queen.phase.entering', fighting: 'boss.scarlet_queen.phase.fighting', dying: 'boss.scarlet_queen.phase.dying', dropping: 'boss.scarlet_queen.phase.dropping' },
  },
  void_reaper: {
    theme: 'void',
    introLine: 'boss.void_reaper.introLine',
    battleLogLine: 'boss.void_reaper.battleLogLine',
    phasePrompts: { entering: 'boss.void_reaper.phase.entering', fighting: 'boss.void_reaper.phase.fighting', dying: 'boss.void_reaper.phase.dying', dropping: 'boss.void_reaper.phase.dropping' },
  },
  clockwork_core: {
    theme: 'clockwork',
    introLine: 'boss.clockwork_core.introLine',
    battleLogLine: 'boss.clockwork_core.battleLogLine',
    phasePrompts: { entering: 'boss.clockwork_core.phase.entering', fighting: 'boss.clockwork_core.phase.fighting', dying: 'boss.clockwork_core.phase.dying', dropping: 'boss.clockwork_core.phase.dropping' },
  },
};

export const attachMonsterLore = (monster: Monster): Monster => {
  const backgroundKey = MONSTER_BACKGROUNDS[monster.id];
  const background = backgroundKey ? i18n.t(backgroundKey) : monster.isBoss ? i18n.t('codex.backgroundFallback') : i18n.t('codex.backgroundFallback');

  const rawBoss = monster.isBoss ? BOSS_IDENTITIES[monster.id] : undefined;
  const bossIdentity = rawBoss
    ? {
        ...rawBoss,
        introLine: i18n.t(rawBoss.introLine as string),
        battleLogLine: i18n.t(rawBoss.battleLogLine as string),
        phasePrompts: {
          entering: i18n.t(rawBoss.phasePrompts?.entering || ''),
          fighting: i18n.t(rawBoss.phasePrompts?.fighting || ''),
          dying: i18n.t(rawBoss.phasePrompts?.dying || ''),
          dropping: i18n.t(rawBoss.phasePrompts?.dropping || ''),
        },
      }
    : undefined;

  return { ...monster, background, bossIdentity};
};