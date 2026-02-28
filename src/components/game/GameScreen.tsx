import type { ActiveTab, BattleSession, GameState } from '../../types/game';
import type { MapProgressState } from '../../types/game';
import type { MapChapterDef, MapNodeDef } from '../../config/map/ChapterData';
import { GamePanel } from './GamePanel';
import { BattleView } from './BattleView';
import DebugPanel from './DebugPanel';
import { memo } from 'react';
interface GameScreenProps {
  gameState: GameState;
  activeTab: ActiveTab;
  loading: boolean;
  playerName: string;
  /** current player stats summary used by header */
  playerStats: import('../../types/game').PlayerStats;
  autoSellQualities: Record<string, boolean>;
  forgeSelectedId: string | null;
  battleSession: BattleSession | null;
  mapProgress: MapProgressState;
  onExportSave: () => void;
  onImportSave: () => void;
  onLogout: () => void;
  onReset: () => void;
  onSetTab: (tab: ActiveTab) => void;
  focusMapNode: string | null;
  onClearFocusMapNode: () => void;
  onEnterMapNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  onSelectMapChapter: (chapterId: string) => void;
  onBattleAttack: (targetId?: string) => void;
  onBattleRetreat: () => void;
  /** debug: cast skill by id */
  onBattleUseSkill?: (skillId: string, targetId?: string) => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string, lockTypes?: string[]) => void;
  onSelectForgeItem: (id: string) => void;
  onUnequip: (slot: string) => void;
  onDebugAddItems?: (quality: string, slot: string, count: number, level?: number) => void;
  onOpenSimulator?: () => void;
}

function GameScreenInner({
  gameState,
  activeTab,
  loading,
  playerName,
  autoSellQualities,
  forgeSelectedId,
  battleSession,
  mapProgress,
  onExportSave,
  onImportSave,
  onLogout,
  onReset,
  onSetTab,
  focusMapNode,
  onClearFocusMapNode,
  onEnterMapNode,
  onSelectMapChapter,
  onBattleAttack,
  onBattleRetreat,
  onBattleUseSkill,
  onQuickSellByQualityRange,
  onEquip,
  onSell,
  onForge,
  onToggleAutoSellQuality,
  onReroll,
  onSelectForgeItem,
  onUnequip,
  onDebugAddItems,
  onOpenSimulator,
}: GameScreenProps) {
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
            <BattleView
              session={battleSession}
              onAttack={onBattleAttack}
              onRetreat={onBattleRetreat}
              onSkill={onBattleUseSkill}
            />
          ) : (
            <GamePanel
              gameState={gameState}
              activeTab={activeTab}
              playerName={playerName}
              playerStats={gameState.playerStats}
              loading={loading}
              focusMapNode={focusMapNode}
              onClearFocusMapNode={onClearFocusMapNode}
              onSetTab={onSetTab}
              onEnterMapNode={onEnterMapNode}
              mapProgress={mapProgress}
              onSelectMapChapter={onSelectMapChapter}
              onQuickSellByQualityRange={onQuickSellByQualityRange}
              onEquip={onEquip}
              onSell={onSell}
              onForge={onForge}
              autoSellQualities={autoSellQualities}
              onToggleAutoSellQuality={onToggleAutoSellQuality}
              onReroll={onReroll}
              forgeSelectedId={forgeSelectedId}
              onSelectForgeItem={onSelectForgeItem}
              onUnequip={onUnequip}
            />
          )}
        </div>
      </main>
      <DebugPanel
        onAddItems={(items) => {
          if (onDebugAddItems) {
            items.forEach((it) => onDebugAddItems(it.quality, it.slot, 1, it.level));
          }
        }}
        onOpenSimulator={onOpenSimulator}
      />
    </div>
  );
}

export const GameScreen = memo(GameScreenInner);
