import { useStateContext } from '../../app/context/state';
import { useDebugContext } from '../../app/context/debug';
import { GamePanel } from './GamePanel';
import { BattleView } from './BattleView.tsx';
import DebugPanel from './DebugPanel';
import { memo } from 'react';

interface GameScreenProps {
  onOpenSimulator?: () => void;
}

function GameScreenInner({ onOpenSimulator }: GameScreenProps) {
  const { gameState } = useStateContext();
  const { handleDebugAddItems } = useDebugContext();
  const battleSession = gameState.battle.activeSession;

  return (
    <div className="flex flex-col h-screen bg-stone-950 overflow-hidden relative dark-game-shell">
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <main className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="flex-1 h-full relative min-h-0 z-content">
          {battleSession ? (
            <BattleView />
          ) : (
            <GamePanel />
          )}
        </div>
      </main>
      <DebugPanel
        onAddItems={(items) => {
          items.forEach((it) => handleDebugAddItems(it.quality, it.slot, 1, it.level));
        }}
        onOpenSimulator={onOpenSimulator}
      />
    </div>
  );
}

export const GameScreen = memo(GameScreenInner);
