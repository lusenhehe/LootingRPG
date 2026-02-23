import type { BattleFrame, Monster, PlayerStats } from '../../types/game';
import { calculateDamage } from './damageCalculator';
import {
  createTraitDispatcher,
  type TraitRuntimeState,
  type TurnContext,
  type TurnState,
  type StatusState,
} from './traitRegistry';
import {
  getFinalPlayerStats,
  getCombatProfile,
} from '../stats/playerStats';
import { getFinalMonsterStats, getTurnCombatSnapshot } from '../stats/monsterStats';

export interface SimulatedBattle {
  monster: Monster;
  frames: BattleFrame[];
  playerWon: boolean;
}

const createStatusState = (): StatusState => ({
  burn: 0,
  poison: 0,
  shock: 0,
  bleed: 0,
});

const statusToLabel = (status: StatusState): string | null => {
  if (status.bleed > 0) return `流血×${status.bleed}`;
  if (status.burn > 0) return `灼烧×${status.burn}`;
  if (status.poison > 0) return `中毒×${status.poison}`;
  if (status.shock > 0) return `感电×${status.shock}`;
  return null;
};

const startOfTurn = (state: TurnState, context: TurnContext) => {
  let playerDotDamage = 0;
  let monsterDotDamage = 0;

  if (state.monsterStatus.burn > 0) {
    const damage = Math.max(1, Math.floor(context.finalPlayer.attack * 0.1));
    state.monsterHp = Math.max(0, state.monsterHp - damage);
    monsterDotDamage += damage;
  }

  if (state.monsterStatus.poison > 0) {
    const damage = Math.max(1, Math.floor(context.finalPlayer.attack * 0.08));
    state.monsterHp = Math.max(0, state.monsterHp - damage);
    monsterDotDamage += damage;
  }

  if (state.playerStatus.bleed > 0) {
    const damage = Math.max(1, Math.floor(context.finalMonster.attack * 0.08));
    state.playerHp = Math.max(0, state.playerHp - damage);
    playerDotDamage += damage;
  }

  if (state.playerStatus.poison > 0) {
    const damage = Math.max(1, Math.floor(context.finalMonster.attack * 0.06));
    state.playerHp = Math.max(0, state.playerHp - damage);
    playerDotDamage += damage;
  }

  return {
    playerDotDamage,
    monsterDotDamage,
  };
};

const endOfTurn = (state: TurnState) => {
  if (state.shieldTurns > 0) state.shieldTurns -= 1;

  state.playerStatus.burn = Math.max(0, state.playerStatus.burn - 1);
  state.playerStatus.poison = Math.max(0, state.playerStatus.poison - 1);
  state.playerStatus.shock = Math.max(0, state.playerStatus.shock - 1);
  state.playerStatus.bleed = Math.max(0, state.playerStatus.bleed - 1);

  state.monsterStatus.burn = Math.max(0, state.monsterStatus.burn - 1);
  state.monsterStatus.poison = Math.max(0, state.monsterStatus.poison - 1);
  state.monsterStatus.shock = Math.max(0, state.monsterStatus.shock - 1);
  state.monsterStatus.bleed = Math.max(0, state.monsterStatus.bleed - 1);
};

const ELEMENT_POOL = ['火', '冰', '雷', '毒', '暗'];

const pickElement = (): string => ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)];

const applyBossPhaseSkill = (turnState: TurnState, context: TurnContext, turn: number): string | null => {
  if (!context.monster.isBoss || turn === 0) return null;

  const phases = context.monster.phases ?? [];
  if (!phases.length) return null;

  const currentTurn = turn + 1;
  const triggeredPhase = phases.find((phase) => currentTurn % Math.max(1, phase.interval) === 0);
  if (!triggeredPhase) return null;

  if (triggeredPhase.action === 'drain_soul') {
    const heal = Math.max(8, Math.floor(context.finalMonster.maxHp * 0.06));
    turnState.monsterHp = Math.min(context.finalMonster.maxHp, turnState.monsterHp + heal);
    return `${triggeredPhase.label} +${heal}`;
  }

  if (triggeredPhase.action === 'reconstruct') {
    const burst = Math.max(
      1,
      Math.floor(calculateDamage(context.finalMonster.attack * 1.1, context.finalPlayer.damageReduction, 1.05)),
    );
    turnState.playerHp = Math.max(0, turnState.playerHp - burst);
    turnState.shieldTurns = Math.max(turnState.shieldTurns, 1);
    return `${triggeredPhase.label} -${burst}`;
  }

  const burst = Math.max(
    1,
    Math.floor(calculateDamage(context.finalMonster.attack * 1.2, context.finalPlayer.damageReduction, 1.1)),
  );
  turnState.playerHp = Math.max(0, turnState.playerHp - burst);
  if (Math.random() < 0.45 * context.finalMonster.statusProcMultiplier) {
    turnState.playerStatus.bleed = Math.max(turnState.playerStatus.bleed, 2);
  }
  return `${triggeredPhase.label} -${burst}`;
};

export const simulateBattle = (
  rawMonster: Monster,
  playerStats: PlayerStats,
  encounterCount: number,
  isBoss: boolean,
): SimulatedBattle => {
  const finalPlayer = getFinalPlayerStats(playerStats, encounterCount);
  const finalMonster = getFinalMonsterStats(
    rawMonster,
    playerStats.等级,
    encounterCount,
    isBoss,
    finalPlayer,
  );
  const combatProfile = getCombatProfile();

  const monster: Monster = {
    ...rawMonster,
    maxHp: finalMonster.maxHp,
    attack: finalMonster.attack,
    defense: finalMonster.defense,
    counterGoalLabel: finalMonster.objectiveLabel,
    counterGoalPassed: finalMonster.objectivePassed,
  };

  const activeTraits = [...new Set([...(monster.traits ?? []), ...(monster.uniqueTraits ?? [])])];
  const eventNotes: string[] = [];
  const note = (text: string) => {
    if (!text) return;
    eventNotes.push(text);
  };

  const context: TurnContext = {
    monster,
    finalPlayer,
    finalMonster,
  };

  const turnState: TurnState = {
    playerHp: finalPlayer.maxHp,
    monsterHp: Math.max(1, finalMonster.maxHp),
    playerStatus: createStatusState(),
    monsterStatus: createStatusState(),
    shieldTurns: 0,
  };

  const runtime: TraitRuntimeState = {
    monsterRageActive: false,
    extraMonsterStrikes: 0,
  };

  const dispatchTraitEvent = createTraitDispatcher(activeTraits, {
    turnState,
    turnContext: context,
    runtime,
    note,
  });

  dispatchTraitEvent('onBattleStart', { turn: 0 });

  const bonusTurns = finalPlayer.attackSpeed >= 40 ? 2 : finalPlayer.attackSpeed >= 20 ? 1 : 0;
  const maxTurns = (isBoss ? 10 : 7) + bonusTurns + combatProfile.turnBonus;
  const frames: BattleFrame[] = [];

  for (let turn = 0; turn < maxTurns; turn++) {
    eventNotes.length = 0;
    const turnLogs: string[] = [];
    const element = pickElement();
    dispatchTraitEvent('onTurnStart', { turn });

    const turnOpen = startOfTurn(turnState, context);
    if (turnOpen.monsterDotDamage > 0) {
      turnLogs.push(`持续效果命中敌方，造成 ${turnOpen.monsterDotDamage} 点伤害。`);
    }
    if (turnOpen.playerDotDamage > 0) {
      turnLogs.push(`你受到持续伤害 ${turnOpen.playerDotDamage} 点。`);
    }
    if (turnState.playerHp <= 0 || turnState.monsterHp <= 0) {
      frames.push({
        playerHpPercent: Math.floor((turnState.playerHp / finalPlayer.maxHp) * 100),
        monsterHpPercent: Math.floor((turnState.monsterHp / finalMonster.maxHp) * 100),
        showAttackFlash: false,
        playerDamageLabel: turnOpen.playerDotDamage > 0 ? `-DOT ${turnOpen.playerDotDamage}` : undefined,
        monsterDamageLabel: turnOpen.monsterDotDamage > 0 ? `-DOT ${turnOpen.monsterDotDamage}` : undefined,
        playerStatusLabel: statusToLabel(turnState.playerStatus) ?? undefined,
        monsterStatusLabel: statusToLabel(turnState.monsterStatus) ?? undefined,
        combatLogs: turnLogs,
      });
      return { monster, frames, playerWon: turnState.monsterHp <= 0 };
    }

    const isCrit = Math.random() < finalPlayer.critRate;
    const elementalMultiplier = 1 + Math.min(0.45, finalPlayer.elementalBonus / 180);
    const turnStats = getTurnCombatSnapshot(finalPlayer, finalMonster, {
      monsterIsShocked: turnState.monsterStatus.shock > 0,
      shieldTurns: turnState.shieldTurns,
      monsterRageActive: runtime.monsterRageActive,
    });
    const rawPlayerDamage = calculateDamage(
      turnStats.playerAttack,
      turnStats.monsterDamageReduction,
      elementalMultiplier * (isCrit ? 1.6 : 1),
    );
    const playerDamage = Math.max(1, Math.floor(rawPlayerDamage * turnStats.shieldMultiplier));
    const shieldAbsorbed = Math.max(0, rawPlayerDamage - playerDamage);
    turnState.monsterHp = Math.max(0, turnState.monsterHp - playerDamage);

    if (isCrit) {
      turnLogs.push(`暴击！你造成了 ${playerDamage} 点伤害。`);
    } else {
      turnLogs.push(`你造成了 ${playerDamage} 点伤害。`);
    }
    if (shieldAbsorbed > 0) {
      turnLogs.push(`护盾吸收了 ${shieldAbsorbed} 点伤害。`);
    }

    dispatchTraitEvent('onDamaged', {
      source: 'player',
      target: 'monster',
      amount: playerDamage,
      turn,
    });

    const monsterHpPercentAfterHit = (turnState.monsterHp / finalMonster.maxHp) * 100;
    if (monsterHpPercentAfterHit <= 50) {
      dispatchTraitEvent('onLowHp', {
        target: 'monster',
        hpPercent: monsterHpPercentAfterHit,
        turn,
      });
    }

    if (element === '火' && Math.random() < 0.28 * finalMonster.statusProcMultiplier) turnState.monsterStatus.burn = 2;
    if (element === '毒' && Math.random() < 0.32 * finalMonster.statusProcMultiplier) turnState.monsterStatus.poison = 3;
    if (element === '雷' && Math.random() < 0.26 * finalMonster.statusProcMultiplier) turnState.monsterStatus.shock = 2;

    const playerLifestealRate = finalPlayer.lifestealRate;
    let playerLifestealValue = 0;
    if (playerLifestealRate > 0) {
      playerLifestealValue = Math.floor(playerDamage * playerLifestealRate);
      turnState.playerHp = Math.min(finalPlayer.maxHp, turnState.playerHp + playerLifestealValue);
      if (playerLifestealValue > 0) {
        turnLogs.push(`吸血生效，恢复 ${playerLifestealValue} 点生命。`);
      }
    }

    if (turnState.monsterHp <= 0) {
      frames.push({
        playerHpPercent: Math.floor((turnState.playerHp / finalPlayer.maxHp) * 100),
        monsterHpPercent: 0,
        showAttackFlash: true,
        monsterDamageLabel: `${isCrit ? '暴击 ' : ''}-${playerDamage}`,
        playerStatusLabel:
          playerLifestealValue > 0 ? `吸血 +${playerLifestealValue}` : eventNotes.length ? eventNotes.join(' · ') : undefined,
        monsterStatusLabel: statusToLabel(turnState.monsterStatus) ?? undefined,
        elementLabel: `${element}元素`,
        combatLogs: turnLogs,
      });
      return { monster, frames, playerWon: true };
    }

    runtime.extraMonsterStrikes = 0;
    dispatchTraitEvent('onAttack', { attacker: 'monster', turn });
    const strikeCount = 1 + runtime.extraMonsterStrikes;
    if (strikeCount > 1) {
      turnLogs.push('敌人发动连击！');
    }

    let totalMonsterDamage = 0;
    for (let i = 0; i < strikeCount; i++) {
      const damage = calculateDamage(
        turnStats.monsterAttack,
        turnStats.playerDamageReduction,
        combatProfile.monsterDamageMultiplier,
      );
      totalMonsterDamage += damage;
      turnState.playerHp = Math.max(0, turnState.playerHp - damage);
    }
    turnLogs.push(`敌人造成了 ${totalMonsterDamage} 点伤害。`);

    dispatchTraitEvent('onDamaged', {
      source: 'monster',
      target: 'player',
      amount: totalMonsterDamage,
      turn,
    });

    const playerHpPercentAfterHit = (turnState.playerHp / finalPlayer.maxHp) * 100;
    if (playerHpPercentAfterHit <= 50) {
      dispatchTraitEvent('onLowHp', {
        target: 'player',
        hpPercent: playerHpPercentAfterHit,
        turn,
      });
    }

    let playerThornsValue = 0;
    if (finalPlayer.thornsRate > 0 && totalMonsterDamage > 0) {
      playerThornsValue = Math.max(1, Math.floor(totalMonsterDamage * finalPlayer.thornsRate));
      turnState.monsterHp = Math.max(0, turnState.monsterHp - playerThornsValue);
      turnLogs.push(`反伤触发，对敌方造成 ${playerThornsValue} 点伤害。`);
    }

    const bossPhaseLabel = applyBossPhaseSkill(turnState, context, turn);
    if (bossPhaseLabel) {
      turnLogs.push(bossPhaseLabel.replace('·', '触发：'));
    }

    if (Math.random() < (monster.isBoss ? 0.22 : 0.12) * finalMonster.statusProcMultiplier) {
      turnState.playerStatus.bleed = Math.min(3, turnState.playerStatus.bleed + 1);
    }

    dispatchTraitEvent('onTurnEnd', { turn });

    const extraPlayerLabel = playerThornsValue > 0 ? `玩家反伤 ${playerThornsValue}` : null;
    const eventLabel = eventNotes.length ? eventNotes.join(' · ') : null;
    if (eventNotes.some((noteText) => noteText.includes('残血狂怒'))) {
      turnLogs.push('狂怒触发，敌方攻击提升！');
    }
    if (eventNotes.length > 0) {
      turnLogs.push(...eventNotes.map((noteText) => `机制效果：${noteText}`));
    }

    frames.push({
      playerHpPercent: Math.floor((turnState.playerHp / finalPlayer.maxHp) * 100),
      monsterHpPercent: Math.floor((turnState.monsterHp / finalMonster.maxHp) * 100),
      showAttackFlash: turn % 2 === 0,
      playerDamageLabel: `-${totalMonsterDamage}${strikeCount > 1 ? ' 连击' : ''}`,
      monsterDamageLabel: `${isCrit ? '暴击 ' : ''}-${playerDamage}${playerThornsValue > 0 ? ` /反伤${playerThornsValue}` : ''}`,
      playerStatusLabel:
        bossPhaseLabel ?? extraPlayerLabel ?? eventLabel ?? statusToLabel(turnState.playerStatus) ?? undefined,
      monsterStatusLabel: statusToLabel(turnState.monsterStatus) ?? undefined,
      elementLabel: `${element}元素${runtime.monsterRageActive ? '·狂怒' : ''}`,
      combatLogs: turnLogs,
    });

    endOfTurn(turnState);

    if (turnState.playerHp <= 0) {
      return { monster, frames, playerWon: false };
    }
  }

  const playerWon = turnState.monsterHp <= turnState.playerHp;
  frames.push({
    playerHpPercent: playerWon ? Math.max(8, Math.floor((turnState.playerHp / finalPlayer.maxHp) * 100)) : 0,
    monsterHpPercent: playerWon ? 0 : Math.floor((turnState.monsterHp / finalMonster.maxHp) * 100),
    showAttackFlash: true,
    playerDamageLabel: playerWon ? undefined : '-致命一击',
    monsterDamageLabel: playerWon ? '-终结' : undefined,
    combatLogs: [playerWon ? '你抓住破绽完成终结。' : '敌人抓住破绽完成致命一击。'],
  });

  return { monster, frames, playerWon };
};
