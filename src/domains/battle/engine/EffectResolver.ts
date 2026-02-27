/**
 * EffectResolver — unified event processing loop.
 *
 * Each event goes through three phases in order:
 *   1. dispatchEvent  → broadcast to all unit listeners (may emit new events)
 *   2. applyBaseEffect → mutate session state (damage, heal, death, etc.)
 *   3. drain bus       → collect any newly emitted events and push to pending queue
 *
 * The loop continues until the pending queue is empty or MAX_EVENT_DEPTH is reached
 * (guard against infinite element-reaction chains or recursive skills).
 */
import type {
  ApplyDamageEvent,
  ApplyHealEvent,
  BattleEvent,
  BattleSession,
  UnitDiedEvent,
  StatusAppliedEvent,
} from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';
import type { BattleListenerRegistry } from './ListenerRegistry';
import { dispatchEvent, MAX_EVENT_DEPTH } from './EventDispatcher';
import { applyStatusFromEvent, maybeEmitElementReaction } from './StatusSystem';

// ─── Base-Effect Handlers ─────────────────────────────────────────────────────

const findUnit = (session: BattleSession, unitId: string): BattleUnitInstance | undefined => {
  if (session.player.id === unitId) return session.player;
  return session.enemies.find((enemy) => enemy.id === unitId);
};

function handleApplyDamage(
  session: BattleSession,
  event: ApplyDamageEvent,
): UnitDiedEvent | undefined {
  const target = findUnit(session, event.targetId);
  if (!target) return;

  let remaining = event.amount;

  // Shield absorption
  if (target.statuses && target.statuses.length > 0) {
    const shields = target.statuses.filter((s) => s.kind === 'shield');
    for (const shield of shields) {
      if (remaining <= 0) break;
      const absorb = Math.min(remaining, Math.max(0, Math.floor(shield.magnitude)));
      if (absorb <= 0) continue;
      shield.magnitude -= absorb;
      remaining -= absorb;
    }
    target.statuses = target.statuses.filter((s) => s.kind !== 'shield' || s.magnitude > 0);
  }

  if (remaining <= 0) {
    event.amount = 0;
    return;
  }

  event.amount = remaining;
  target.currentHp -= remaining;

  if (target.currentHp <= 0) {
    target.currentHp = 0;
    return { type: 'unit_died', unitId: target.id };
  }
  return;
}

function handleApplyHeal(session: BattleSession, event: ApplyHealEvent): void {
  const target = findUnit(session, event.targetId);
  if (!target) return;
  target.currentHp = Math.min(target.baseStats.hp, target.currentHp + event.amount);
}

function handleUnitDied(session: BattleSession, event: UnitDiedEvent): void {
  const unit = findUnit(session, event.unitId);
  if (!unit) return;
  unit.currentHp = 0;
  session.logs.push(`[Battle] ${unit.name} defeated.`);
}

// ─── Main Loop ────────────────────────────────────────────────────────────────

export function resolveEffects(
  session: BattleSession,
  events: BattleEvent[],
  eventBus?: BattleEventBus,
  registry?: BattleListenerRegistry,
): BattleSession {
  const pendingEvents: BattleEvent[] = [...events];
  let depth = 0;

  while (pendingEvents.length > 0) {
    if (depth >= MAX_EVENT_DEPTH) {
      session.logs.push('[Battle] ⚠ Event chain depth limit reached — chain aborted.');
      break;
    }
    depth++;

    const event = pendingEvents.shift();
    if (!event) break;

    session.events.push(event);

    // ── Phase 1: Broadcast to listeners ───────────────────────────────────
    if (eventBus) {
      dispatchEvent(session, event, eventBus, [], registry);
      // Drain listener-generated events and insert at head of queue (priority)
      const listenerEvents = eventBus.drainEvents();
      pendingEvents.unshift(...listenerEvents);
    }

    // ── Phase 2: Apply base effect ────────────────────────────────────────
    switch (event.type) {
      case 'apply_damage': {
        const deathEvent = handleApplyDamage(session, event);
        if (deathEvent) {
          pendingEvents.push(deathEvent);
          pendingEvents.push({
            type: 'on_kill',
            killerId: event.sourceId,
            victimId: event.targetId,
          });
        }
        if (eventBus) {
          maybeEmitElementReaction(session, event.sourceId, event.targetId, eventBus);
        }
        break;
      }
      case 'apply_heal':
        handleApplyHeal(session, event);
        break;
      case 'unit_died':
        handleUnitDied(session, event);
        break;
      case 'status_applied':
        applyStatusFromEvent(session, event as StatusAppliedEvent);
        break;
      case 'element_reaction':
        // Secondary damage already emitted by maybeEmitElementReaction; no further base effect.
        break;
      case 'status_expired':
        // Listener self-cleaned; log entry optional.
        break;
      case 'status_tick':
        // Legacy event — tick handling moved to on_turn_start listeners in StatusSystem.
        break;
      default:
        // Lifecycle events (before_action, after_action, on_cast, on_turn_start, etc.)
        // have no base effect; listeners handle them above.
        break;
    }

    // ── Phase 3: Drain bus after base effect ──────────────────────────────
    if (eventBus) {
      const afterEvents = eventBus.drainEvents();
      pendingEvents.push(...afterEvents);
    }
  }

  return session;
}

