import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { ActiveTab, BattleState, GameState, MapProgressState } from '../../types/game';
import { TabButton } from '../ui/TabButton';
import { InventoryTab } from './tabs/InventoryTab';
import { ForgeTab } from './tabs/ForgeTab';
import { MonsterCodexTab } from './tabs/MonsterCodexTab';
import { MapTab } from './tabs/MapTab';
import { BattleArena } from './BattleArena';
import type { MapChapterDef, MapNodeDef } from '../../config/mapChapters';

interface GamePanelProps {
  gameState: GameState;
  battleState: BattleState;
  activeTab: ActiveTab;
  loading: boolean;
  onSetTab: (tab: ActiveTab) => void;
  onChallengeMonster: () => void;
  onChallengeBoss: () => void;
  onChallengeWave: () => void;
  onEnterMapNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  mapProgress: MapProgressState;
  onSelectMapChapter: (chapterId: string) => void;
  autoBattleEnabled: boolean;
  onToggleAutoBattle: () => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  autoSellQualities: Record<string, boolean>;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string) => void;
  forgeSelectedId: string | null;
  onSelectForgeItem: (id: string) => void;
}

export function GamePanel({
  gameState,
  battleState,
  activeTab,
  loading,
  onSetTab,
  onChallengeMonster,
  onChallengeBoss,
  onChallengeWave,
  onEnterMapNode,
  mapProgress,
  onSelectMapChapter,
  autoBattleEnabled,
  onToggleAutoBattle,
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
  const inventoryItems = gameState.背包
    .filter((item) => !item.已装备)
    .map((item) => ({ ...item, 已装备: false }));

  return (
    <div className="lg:col-span-8 flex flex-col gap-6">
      <div className="bg-gradient-to-br from-game-card/90 to-game-card/70 border border-game-border/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-purple-500/5 min-h-[400px] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-rose-500/3 pointer-events-none" />
        
        <div className="flex border-b border-game-border relative z-10">
          <TabButton active={activeTab === 'status'} onClick={() => onSetTab('status')} label="战斗场景" />
          <TabButton active={activeTab === 'map'} onClick={() => onSetTab('map')} label={t('map.explore')} />
          <TabButton active={activeTab === 'inventory'} onClick={() => onSetTab('inventory')} label="背包仓库" />
          <TabButton active={activeTab === 'forge'} onClick={() => onSetTab('forge')} label="强化中心" />
          <TabButton active={activeTab === 'codex'} onClick={() => onSetTab('codex')} label="怪物图鉴" />
        </div>

        <div className="p-4 overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'status' && (
              <motion.div 
                key="battle" 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.98 }} 
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <BattleArena
                  battleState={battleState}
                  loading={loading}
                  onChallengeMonster={onChallengeMonster}
                  onChallengeBoss={onChallengeBoss}
                  onChallengeWave={onChallengeWave}
                  autoBattleEnabled={autoBattleEnabled}
                  onToggleAutoBattle={onToggleAutoBattle}
                />
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
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
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <MapTab
                  playerLevel={gameState.玩家状态.等级}
                  loading={loading}
                  progress={mapProgress}
                  onSelectChapter={onSelectMapChapter}
                  onEnterNode={onEnterMapNode}
                />
              </motion.div>
            )}

            {activeTab === 'forge' && (
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
            )}

            {activeTab === 'codex' && (
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
              <span>传说保底:</span> 
              <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(gameState.保底计数.传说 / 50) * 100}%` }}
                />
              </div>
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 cursor-default"
            >
              <Trophy size={10} className="text-red-500" /> 
              <span>神话保底:</span> 
              <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(gameState.保底计数.神话 / 200) * 100}%` }}
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
