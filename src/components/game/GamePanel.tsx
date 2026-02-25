import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense } from 'react';
import { Trophy } from 'lucide-react';
import type { ActiveTab, GameState, MapProgressState } from '../../types/game';
import { TabButton } from '../ui/TabButton';
import type { MapChapterDef, MapNodeDef } from '../../config/map/ChapterData';

const InventoryTab = lazy(() => import('./tabs/InventoryTab').then(m => ({ default: m.InventoryTab })));
const ForgeTab = lazy(() => import('./tabs/ForgeTab').then(m => ({ default: m.ForgeTab })));
const MonsterCodexTab = lazy(() => import('./tabs/MonsterCodexTab').then(m => ({ default: m.MonsterCodexTab })));
const MapTab = lazy(() => import('./tabs/MapTab').then(m => ({ default: m.MapTab })));

interface GamePanelProps {
  gameState: GameState;
  activeTab: ActiveTab;
  loading: boolean;
  focusMapNode: string | null;
  onClearFocusMapNode: () => void;
  onSetTab: (tab: ActiveTab) => void;
  onEnterMapNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  mapProgress: MapProgressState;
  onSelectMapChapter: (chapterId: string) => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  autoSellQualities: Record<string, boolean>;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string, lockTypes?: string[]) => void;
  forgeSelectedId: string | null;
  onSelectForgeItem: (id: string) => void;
}

export function GamePanel({
  gameState,
  activeTab,
  loading,
  focusMapNode,
  onClearFocusMapNode,
  onSetTab,
  onEnterMapNode,
  mapProgress,
  onSelectMapChapter,
  onEquip,
  onSell,
  onForge,
  onQuickSellByQualityRange,
  autoSellQualities,
  onToggleAutoSellQuality,
  onReroll,
  forgeSelectedId,
  onSelectForgeItem,
}: GamePanelProps) {
  const { t } = useTranslation();
  const inventoryItems = gameState.backpack
    .filter((item) => !item.equipped)
    .map((item) => ({ ...item, equipped: false }));
  return (
    <div className="lg:col-span-8 flex flex-col gap-6 h-full">
      <div className="bg-gradient-to-br from-game-card/90 to-game-card/70 border border-game-border/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-red-900/10 h-[68vh] max-h-[820px] min-h-[420px] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-rose-500/3 pointer-events-none" />
        
        <div className="flex border-b border-game-border relative z-10">
          <TabButton active={activeTab === 'map'} onClick={() => onSetTab('map')} label={t('map.explore')} />
          <TabButton active={activeTab === 'inventory'} onClick={() => onSetTab('inventory')} label={t('tabs.inventory')} />
          <TabButton active={activeTab === 'forge'} onClick={() => onSetTab('forge')} label={t('tabs.forge')} />
          <TabButton active={activeTab === 'codex'} onClick={() => onSetTab('codex')} label={t('tabs.codex')} />
        </div>

        <div className="p-4 overflow-hidden relative z-10 h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading...</div>}>
                  <InventoryTab
                    items={inventoryItems}
                    loading={loading}
                    onEquip={onEquip}
                    onSell={onSell}
                  onForge={onForge}
                  onQuickSellByQualityRange={onQuickSellByQualityRange}
                  autoSellQualities={autoSellQualities}
                  onToggleAutoSellQuality={onToggleAutoSellQuality}
                />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading...</div>}>
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <MapTab
                    playerLevel={gameState.playerStats.level}
                    loading={loading}
                    progress={mapProgress}
                    onSelectChapter={onSelectMapChapter}
                    onEnterNode={onEnterMapNode}
                    focusNodeId={focusMapNode}
                    onClearFocus={onClearFocusMapNode}
                  />
                </motion.div>
              </Suspense>
            )}

            {activeTab === 'forge' && (
              <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading...</div>}>
                <motion.div 
                  key="forge"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ForgeTab
                    gameState={gameState}
                    selectedId={forgeSelectedId}
                    loading={loading}
                    onSelect={onSelectForgeItem}
                    onForge={onForge}
                    onReroll={onReroll}
                  />
                </motion.div>
              </Suspense>
            )}

            {activeTab === 'codex' && (
              <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading...</div>}>
                <motion.div 
                  key="codex"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <MonsterCodexTab />
                </motion.div>
              </Suspense>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-game-bg/80 border-t border-game-border/50 h-16 px-3 flex items-center justify-between text-[10px] font-mono text-gray-500 relative z-10 shrink-0">
          <div className="flex gap-4">
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 cursor-default"
            >
              <Trophy size={10} className="text-yellow-500" /> 
              <span>{t('label.legendary_pity')}</span> 
              <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(gameState.pityCounts.legendary / 50) * 100}%` }}
                />
              </div>
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 cursor-default"
            >
              <Trophy size={10} className="text-red-500" /> 
              <span>{t('label.mythic_pity')}</span> 
              <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(gameState.pityCounts.mythic / 200) * 100}%` }}
                />
              </div>
            </motion.span>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500" 
            />
            <span className="text-green-500/70">READY</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
