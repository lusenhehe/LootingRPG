import type { BattleFrame, Monster, PlayerStats } from '../../types/game';
import { calculateDamage } from './damageCalculator';
import { getFinalPlayerStats, getCombatProfile } from '../stats/playerStats';
import { getFinalMonsterStats, getTurnCombatSnapshot, type FinalMonsterCombatStats } from '../stats/monsterStats';

export interface SimulatedBattle {
  monster: Monster;
  monsters: Monster[];
  frames: BattleFrame[];
  playerWon: boolean;
}

const ELEMENT_POOL = ['火', '冰', '雷', '毒', '暗'];

const pickElement = (): string => ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)];

const toArray = (value: Monster | Monster[]): Monster[] => (Array.isArray(value) ? value : [value]);

export const simulateBattle = (
  rawMonsterOrMonsters: Monster | Monster[],
  playerStats: PlayerStats,
  encounterCount: number,
  isBoss: boolean,
): SimulatedBattle => {
  const rawMonsters = toArray(rawMonsterOrMonsters);
  const finalPlayer = getFinalPlayerStats(playerStats, encounterCount);
  const combatProfile = getCombatProfile();

  const finalMonsters: FinalMonsterCombatStats[] = rawMonsters.map((rawMonster) =>
    getFinalMonsterStats(rawMonster, playerStats.等级, encounterCount, isBoss || !!rawMonster.isBoss, finalPlayer),
  );

  const monsters = rawMonsters.map((rawMonster, idx) => ({
    ...rawMonster,
    maxHp: finalMonsters[idx].maxHp,
    attack: finalMonsters[idx].attack,
    defense: finalMonsters[idx].defense,
    counterGoalLabel: finalMonsters[idx].objectiveLabel,
    counterGoalPassed: finalMonsters[idx].objectivePassed,
  } as Monster));

  const monsterCurrentHp = monsters.map((m) => Math.max(1, m.maxHp));
  const frames: BattleFrame[] = [];

  let playerHp = finalPlayer.maxHp;
  let targetCursor = 0;

  const hasBoss = monsters.some((m) => m.isBoss);
  const bonusTurns = finalPlayer.attackSpeed >= 40 ? 2 : finalPlayer.attackSpeed >= 20 ? 1 : 0;
  const maxTurns = (hasBoss ? 10 : 7) + bonusTurns + combatProfile.turnBonus;

  const buildPercents = () => monsterCurrentHp.map((hp, i) => Math.max(0, Math.floor((hp / monsters[i].maxHp) * 100)));

  for (let turn = 0; turn < maxTurns; turn++) {
    const aliveIndexes = monsterCurrentHp
      .map((hp, idx) => ({ hp, idx }))
      .filter((item) => item.hp > 0)
      .map((item) => item.idx);

    if (!aliveIndexes.length) {
      return {
        monster: monsters[0],
        monsters,
        frames,
        playerWon: true,
      };
    }

    if (playerHp <= 0) {
      return {
        monster: monsters[0],
        monsters,
        frames,
        playerWon: false,
      };
    }

    const targetIndex = aliveIndexes[targetCursor % aliveIndexes.length];
    targetCursor += 1;

    const element = pickElement();
    const targetMonster = monsters[targetIndex];
    const isCrit = Math.random() < finalPlayer.critRate;
    const elementalMultiplier = 1 + Math.min(0.45, finalPlayer.elementalBonus / 180);

    const targetTurnStats = getTurnCombatSnapshot(finalPlayer, finalMonsters[targetIndex], {
      monsterIsShocked: false,
      shieldTurns: 0,
      monsterRageActive: false,
    });

    const rawPlayerDamage = calculateDamage(
      targetTurnStats.playerAttack,
      targetTurnStats.monsterDamageReduction,
      elementalMultiplier * (isCrit ? 1.6 : 1),
    );
    const playerDamage = Math.max(1, Math.floor(rawPlayerDamage * targetTurnStats.shieldMultiplier));

    monsterCurrentHp[targetIndex] = Math.max(0, monsterCurrentHp[targetIndex] - playerDamage);

    const playerLifestealRate = finalPlayer.lifestealRate;
    let playerLifestealValue = 0;
    if (playerLifestealRate > 0) {
      playerLifestealValue = Math.floor(playerDamage * playerLifestealRate);
      playerHp = Math.min(finalPlayer.maxHp, playerHp + playerLifestealValue);
    }

    const afterHitAlive = monsterCurrentHp
      .map((hp, idx) => ({ hp, idx }))
      .filter((item) => item.hp > 0)
      .map((item) => item.idx);

    let totalMonsterDamage = 0;
    for (const idx of afterHitAlive) {
      const turnStats = getTurnCombatSnapshot(finalPlayer, finalMonsters[idx], {
        monsterIsShocked: false,
        shieldTurns: 0,
        monsterRageActive: false,
      });

      const damage = calculateDamage(
        turnStats.monsterAttack,
        turnStats.playerDamageReduction,
        combatProfile.monsterDamageMultiplier,
      );
      totalMonsterDamage += damage;
    }

    playerHp = Math.max(0, playerHp - totalMonsterDamage);

    // player thorns: reflect to all alive monsters evenly
    if (finalPlayer.thornsRate > 0 && totalMonsterDamage > 0 && afterHitAlive.length > 0) {
      const reflectTotal = Math.max(1, Math.floor(totalMonsterDamage * finalPlayer.thornsRate));
      const each = Math.max(1, Math.floor(reflectTotal / afterHitAlive.length));
      afterHitAlive.forEach((idx) => {
        monsterCurrentHp[idx] = Math.max(0, monsterCurrentHp[idx] - each);
      });
    }

    const monsterHpPercents = buildPercents();
    const monsterDamageLabels = monsters.map((_, idx) => (idx === targetIndex ? `${isCrit ? '暴击 ' : ''}-${playerDamage}` : ''));
    const monsterStatusLabels = monsters.map(() => '');

    const playerDamageLabel = `-${totalMonsterDamage}`;
    const playerStatusLabel = playerLifestealValue > 0 ? `吸血 +${playerLifestealValue}` : undefined;

    const combatLogs = [
      `你攻击了 ${targetMonster.name}，造成 ${playerDamage} 点伤害。`,
      `敌方合计造成 ${totalMonsterDamage} 点伤害。`,
    ];

    frames.push({
      playerHpPercent: Math.floor((playerHp / finalPlayer.maxHp) * 100),
      monsterHpPercent: Math.max(...monsterHpPercents, 0),
      monsterHpPercents,
      showAttackFlash: turn % 2 === 0,
      playerDamageLabel,
      monsterDamageLabel: monsterDamageLabels[targetIndex] || undefined,
      monsterDamageLabels,
      playerStatusLabel,
      monsterStatusLabel: undefined,
      monsterStatusLabels,
      elementLabel: `${element}元素`,
      combatLogs,
    });

    const allDead = monsterCurrentHp.every((hp) => hp <= 0);
    if (allDead) {
      return {
        monster: monsters[0],
        monsters,
        frames,
        playerWon: true,
      };
    }

    if (playerHp <= 0) {
      return {
        monster: monsters[0],
        monsters,
        frames,
        playerWon: false,
      };
    }
  }

  const remainingMonsterHp = monsterCurrentHp.reduce((sum, hp) => sum + hp, 0);
  const playerWon = remainingMonsterHp <= playerHp;

  frames.push({
    playerHpPercent: playerWon ? Math.max(8, Math.floor((playerHp / finalPlayer.maxHp) * 100)) : 0,
    monsterHpPercent: playerWon ? 0 : Math.max(...buildPercents(), 0),
    monsterHpPercents: playerWon ? monsters.map(() => 0) : buildPercents(),
    showAttackFlash: true,
    playerDamageLabel: playerWon ? undefined : '-致命一击',
    monsterDamageLabel: playerWon ? '-终结' : undefined,
    monsterDamageLabels: monsters.map((_, idx) => (idx === 0 && playerWon ? '-终结' : '')),
    monsterStatusLabels: monsters.map(() => ''),
    combatLogs: [playerWon ? '你抓住破绽完成终结。' : '敌人抓住破绽完成致命一击。'],
  });

  return {
    monster: monsters[0],
    monsters,
    frames,
    playerWon,
  };
};
