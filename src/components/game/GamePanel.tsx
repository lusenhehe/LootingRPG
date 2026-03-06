import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, memo } from 'react';
import { Trophy, Map } from 'lucide-react';
import { useMapContext } from '../../app/context/map';
import { useStateContext } from '../../app/context/state';

const InventoryTab = lazy(() => import('./tabs/InventoryTab').then(m => ({ default: m.InventoryTab })));
const ForgeTab = lazy(() => import('./tabs/ForgeTab').then(m => ({ default: m.ForgeTab })));
const MonsterCodexTab = lazy(() => import('./tabs/MonsterCodexTab').then(m => ({ default: m.MonsterCodexTab })));
const MapTab = lazy(() => import('./tabs/MapTab').then(m => ({ default: m.MapTab })));

const TabFallback = () => (
  <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
);

function GamePanelInner() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useMapContext();
  const { gameState } = useStateContext();

  return (
    <div className="dark-stage-shell overflow-hidden h-full min-h-0 relative flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-amber-950/10 pointer-events-none" />
      
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

        <div className={`${activeTab === 'map' ? 'p-0' : 'p-4'} overflow-hidden relative z-10 flex-1 min-h-0`}>
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
                <Suspense fallback={<TabFallback />}>
                  <InventoryTab />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <Suspense fallback={<TabFallback />}>
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <MapTab />
                </motion.div>
              </Suspense>
            )}

            {activeTab === 'forge' && (
              <Suspense fallback={<TabFallback />}>
                <motion.div 
                  key="forge"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ForgeTab />
                </motion.div>
              </Suspense>
            )}

            {activeTab === 'codex' && (
              <Suspense fallback={<TabFallback />}>
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

        <div className="bg-black/45 border-t border-amber-900/25 h-16 px-3 flex items-center justify-between text-[10px] font-mono text-gray-500 relative z-overlay shrink-0 backdrop-blur-[2px]">
          <div className="flex gap-1.5">
            {activeTab !== 'map' && (
              <button
                onClick={() => setActiveTab('map')}
                className="px-2.5 py-1.5 clip-corner-8 border border-amber-700/40 text-amber-200 bg-amber-900/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Map size={11} /> {t('map.explore')}
              </button>
            )}
          </div>

          <div className="flex gap-3">
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
        </div>
      </div>
  );
}

export const GamePanel = memo(GamePanelInner);
