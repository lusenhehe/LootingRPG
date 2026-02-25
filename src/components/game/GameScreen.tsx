import type { ActiveTab, BattleSession, GameState } from '../../types/game';
import type { MapProgressState } from '../../types/game';
import type { MapChapterDef, MapNodeDef } from '../../config/map/ChapterData';
import { AppHeader } from './AppHeader';
import { GamePanel } from './GamePanel';
import { PlayerPanel } from './PlayerPanel';
import { BattleView } from './BattleView';
import DebugPanel from './DebugPanel';

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
  onBattleAttack: () => void;
  onBattleRetreat: () => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string, lockTypes?: string[]) => void;
  onSelectForgeItem: (id: string) => void;
  onUnequip: (slot: string) => void;
  onDebugAddItems?: (quality: string, slot: string, count: number, level?: number) => void;
}

export function GameScreen({
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
  onQuickSellByQualityRange,
  onEquip,
  onSell,
  onForge,
  onToggleAutoSellQuality,
  onReroll,
  onSelectForgeItem,
  onUnequip,
  onDebugAddItems,
}: GameScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-red-900/30 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-rose-500/15 blur-3xl rounded-full" />

      <div className="relative flex flex-col max-w-6xl mx-auto p-4 md:p-6 gap-6">

        <AppHeader
          gold={gameState.playerStats.gold}
          playerName={playerName}
          playerStats={gameState.playerStats}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onLogout={onLogout}
          onReset={onReset}
        />

        <main className="grid grid-cols-1 lg:flex gap-6 items-start">
          <div className="lg:flex-none lg:w-[28%] lg:max-w-[380px] lg:min-w-[240px]">
            <PlayerPanel gameState={gameState} onUnequip={onUnequip} />
          </div>

          <div className="flex-1">
            {battleSession ? (
              <BattleView
                session={battleSession}
                onAttack={onBattleAttack}
                onRetreat={onBattleRetreat}
              />
            ) : (
              <GamePanel
                gameState={gameState}
                activeTab={activeTab}
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
              />
            )}
          </div>
        </main>
        <DebugPanel onAddItems={(items) => {
          // forward to parent via optional callback (preserve item level)
          if (onDebugAddItems) {
            items.forEach((it) => onDebugAddItems(it.quality, it.slot, 1, it.level));
          }
        }} />
      </div>
    </div>
  );
}
