import type { BattleEvent } from '../../../shared/types/game';

export class BattleEventBus {
  private readonly events: BattleEvent[] = [];

  emit(event: BattleEvent): void {
    this.events.push(event);
  }

  getEvents(): BattleEvent[] {
    return [...this.events];
  }

  drainEvents(): BattleEvent[] {
    const snapshot = [...this.events];
    this.events.length = 0;
    return snapshot;
  }
}
