import { normalizeMapProgress, getChapterProgress} from '../../../domains/map/services/progress';
import type { MapChapterDef, MapNodeDef } from '../../../config/map/ChapterData';
import { Star, ChevronDown, Mountain, Lock } from 'lucide-react';
import { MAP_CHAPTERS } from '../../../config/map/ChapterData';
import { themeColors } from '../../../config/map/mapNode';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import MapViewport from '../map/MapViewport';
import { useMemo, useState, memo } from 'react';
import { useMapContext } from '../../../app/context/map';
import { useBattleContext } from '../../../app/context/battle';
import { useStateContext } from '../../../app/context/state';
import { useAuthContext } from '../../../app/context/auth';
function MapTabInner() {
  const { mapProgress: progress, setMapProgress, activeTab, setActiveTab: onSetTab, focusMapNode: focusNodeId, setFocusMapNode } = useMapContext();
  const { handleEnterMapNode: onEnterNode } = useBattleContext();
  const { gameState, loading } = useStateContext();
  const { profiles, activeProfileId } = useAuthContext();
  const playerName = profiles.find(p => p.id === activeProfileId)?.name ?? 'Unknown Player';
  const playerStats = gameState.playerStats;
  const playerLevel = gameState.playerStats.level;
  const onSelectChapter = (chapterId: string) => setMapProgress((prev) => ({ ...prev, selectedChapterId: chapterId }));
  const onClearFocus = () => setFocusMapNode(null);
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const normalizedProgress = useMemo(() => normalizeMapProgress(progress, MAP_CHAPTERS), [progress]);

  const selectedChapter = useMemo(
    () =>
      MAP_CHAPTERS.find((c) => c.id === normalizedProgress.selectedChapterId) ?? MAP_CHAPTERS[0],
    [normalizedProgress.selectedChapterId]
  );

  const selectedChapterProgress = useMemo(
    () =>
      selectedChapter ? getChapterProgress(normalizedProgress, selectedChapter) : { cleared: 0, total: 0, completed: false },
    [normalizedProgress, selectedChapter]
  );

  const totalStars = useMemo(() => {
    let stars = 0;
    MAP_CHAPTERS.forEach(chapter => {
      const chapterProgress = getChapterProgress(normalizedProgress, chapter);
      if (chapterProgress.completed) stars += chapter.nodes.length;
    });
    return stars;
  }, [normalizedProgress]);

  const chapterThemeColors = themeColors[selectedChapter.theme];

  return (
    <motion.div
      key="map"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-full min-h-0 relative flex flex-col"
    >
      <div className="absolute top-3 left-4 right-4 z-overlay flex items-center justify-end gap-3 pointer-events-none">
        <div className="flex items-center gap-2 text-xs pointer-events-auto bg-black/45 border border-amber-900/30 px-2.5 py-1 clip-corner-8">
          <Star size={12} className="text-amber-400" fill="currentColor" />
          <span className="text-stone-400">{totalStars}</span>
          <span className="text-stone-600">|</span>
          <span className="text-stone-500">{selectedChapter.levelRange}</span>
          <span className="text-stone-600">|</span>
          <span style={{ color: chapterThemeColors.primaryLight }}>{selectedChapterProgress.cleared}/{selectedChapterProgress.total}</span>
          <span className="text-stone-600">|</span>
          <span className="px-1.5 py-0.5 rounded font-medium" style={{ 
            backgroundColor: `${chapterThemeColors.primary}22`, 
            color: chapterThemeColors.primaryLight 
          }}>
            {Math.round((selectedChapterProgress.cleared / selectedChapterProgress.total) * 100)}%
          </span>
        </div>
      </div>
      <MapViewport
        activeTab={activeTab}
        playerName={playerName}
        playerStats={playerStats}
        playerLevel={playerLevel}
        loading={loading}
        normalizedProgress={normalizedProgress}
        selectedChapter={selectedChapter}
        onSetTab={onSetTab}
        onEnterNode={onEnterNode}
        focusNodeId={focusNodeId}
        onClearFocus={onClearFocus}
      />
      
      {/* dropdown moved to bottom-right */}
      <div className="absolute bottom-16 right-4 z-overlay">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/55 backdrop-blur-sm clip-corner-8 border transition-all cursor-pointer hover:bg-stone-800/60 pointer-events-auto"
            style={{ borderColor: `${chapterThemeColors.primary}33` }}
          >
            <Mountain size={16} style={{ color: chapterThemeColors.primaryLight }} />
            <span className="text-sm font-medium" style={{ color: chapterThemeColors.primaryLight }}>{t(`map.${selectedChapter.id}`)}</span>
            <ChevronDown size={14} className={`text-stone-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-overlay" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full mb-1 right-0 z-dropdown bg-stone-950/95 backdrop-blur-xl clip-corner-8 border border-white/10 shadow-xl py-1 min-w-[220px] pointer-events-auto"
                >
                  {MAP_CHAPTERS.map((chapter) => {
                    const unlocked = normalizedProgress.unlockedChapters.includes(chapter.id);
                    const chapterProgress = getChapterProgress(normalizedProgress, chapter);
                    const chapterColors = themeColors[chapter.theme];
                    
                    return (
                      <button
                        key={chapter.id}
                        disabled={!unlocked}
                        onClick={() => { onSelectChapter(chapter.id); setDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${selectedChapter.id === chapter.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                        style={{ opacity: unlocked ? 1 : 0.4 }}
                      >
                        <Mountain size={14} style={{ color: chapterColors.primaryLight }} />
                        <span className="flex-1 text-sm text-stone-200">{t(`map.${chapter.id}`)}</span>
                        {chapterProgress.completed && <Star size={12} className="text-amber-400" fill="currentColor" />}
                        {!unlocked && <Lock size={12} className="text-stone-500" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export const MapTab = memo(MapTabInner);
