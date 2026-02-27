import type { BattleSession } from '../../../shared/types/game';
import { BattleEventBus } from './EventBus';
import { resolveTurn } from './TurnManager';

export class BattleEngine {
  static resolveTurn(
    session: BattleSession,
    playerActionOverride?: import('../../../shared/types/game').BattleAction,
  ): BattleSession {
    const eventBus = new BattleEventBus();
    return resolveTurn(session, eventBus, playerActionOverride);
  }
}
