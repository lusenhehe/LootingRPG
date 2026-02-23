import type { Monster, MonsterTrait } from '../../types/game';
import type { FinalMonsterCombatStats } from '../stats/monsterStats';
import type { FinalPlayerCombatStats } from '../stats/playerStats';

export interface StatusState {
  burn: number;
  poison: number;
  shock: number;
  bleed: number;
}

export interface TurnState {
  playerHp: number;
  monsterHp: number;
  playerStatus: StatusState;
  monsterStatus: StatusState;
  shieldTurns: number;
}

export interface TurnContext {
  monster: Monster;
  finalPlayer: FinalPlayerCombatStats;
  finalMonster: FinalMonsterCombatStats;
}

export interface TraitRuntimeState {
  monsterRageActive: boolean;
  extraMonsterStrikes: number;
}

export type BattleEventName = 'onBattleStart' | 'onTurnStart' | 'onAttack' | 'onDamaged' | 'onLowHp' | 'onTurnEnd';

export interface BattleEventPayloadMap {
  onBattleStart: { turn: number };
  onTurnStart: { turn: number };
  onAttack: { attacker: 'player' | 'monster'; turn: number };
  onDamaged: { source: 'player' | 'monster'; target: 'player' | 'monster'; amount: number; turn: number };
  onLowHp: { target: 'player' | 'monster'; hpPercent: number; turn: number };
  onTurnEnd: { turn: number };
}

export interface TraitEventContext {
  turnState: TurnState;
  turnContext: TurnContext;
  runtime: TraitRuntimeState;
  note: (text: string) => void;
}

export type TraitHandler = {
  [K in BattleEventName]?: (ctx: TraitEventContext, payload: BattleEventPayloadMap[K]) => void;
};

const traitRegistry = new Map<MonsterTrait, TraitHandler>();

export const registerTrait = (trait: MonsterTrait, handler: TraitHandler) => {
  traitRegistry.set(trait, handler);
};

export const getTraitHandler = (trait: MonsterTrait): TraitHandler | undefined => traitRegistry.get(trait);

export const createTraitDispatcher = (activeTraits: MonsterTrait[], context: TraitEventContext) => {
  return <T extends BattleEventName>(eventName: T, payload: BattleEventPayloadMap[T]) => {
    activeTraits.forEach((trait) => {
      const handler = getTraitHandler(trait)?.[eventName] as
        | ((ctx: TraitEventContext, payload: BattleEventPayloadMap[T]) => void)
        | undefined;
      handler?.(context, payload);
    });
  };
};

registerTrait('thorns', {
  onDamaged: (ctx, payload) => {
    if (payload.target !== 'monster' || payload.amount <= 0) return;
    const reflectedDamage = Math.max(1, Math.floor(payload.amount * 0.12));
    ctx.turnState.playerHp = Math.max(0, ctx.turnState.playerHp - reflectedDamage);
    ctx.note(`反伤 ${reflectedDamage}`);
  },
});

registerTrait('lifesteal', {
  onDamaged: (ctx, payload) => {
    if (payload.target !== 'player' || payload.amount <= 0) return;
    const healed = Math.max(1, Math.floor(payload.amount * 0.2));
    ctx.turnState.monsterHp = Math.min(ctx.turnContext.finalMonster.maxHp, ctx.turnState.monsterHp + healed);
    ctx.note(`敌方吸血 +${healed}`);
  },
});

registerTrait('double_attack', {
  onAttack: (ctx, payload) => {
    if (payload.attacker !== 'monster') return;
    const strikeChance = ctx.turnContext.monster.isBoss ? 0.36 : 0.24;
    if (Math.random() < strikeChance) {
      ctx.runtime.extraMonsterStrikes = Math.max(ctx.runtime.extraMonsterStrikes, 1);
      ctx.note('敌方二连击');
    }
  },
});

registerTrait('shield_on_start', {
  onBattleStart: (ctx) => {
    ctx.turnState.shieldTurns = Math.max(ctx.turnState.shieldTurns, 1);
    ctx.note('开场护盾');
  },
});

registerTrait('rage_on_low_hp', {
  onLowHp: (ctx, payload) => {
    if (payload.target !== 'monster' || payload.hpPercent > 50 || ctx.runtime.monsterRageActive) return;
    ctx.runtime.monsterRageActive = true;
    ctx.note('残血狂怒');
  },
});
