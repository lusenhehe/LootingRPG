import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { MapPin, Star } from 'lucide-react';
import { MAP_CHAPTERS, type MapChapterDef } from '../../../config/mapChapters';
import type { MapProgressState } from '../../../types/game';
import {
  normalizeMapProgress,
  getChapterProgress,
} from '../../../logic/mapProgress';
import MapViewport from '../map/MapViewport';

interface MapTabProps {
  playerLevel: number;
  loading: boolean;
  progress: MapProgressState;
  onSelectChapter: (chapterId: string) => void;
  onEnterNode: (node: any, chapter: MapChapterDef) => void;
}

export function MapTab({ playerLevel, loading, progress, onSelectChapter, onEnterNode }: MapTabProps) {
  const { t } = useTranslation();
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

  if (!selectedChapter) return null;

  return (
    <motion.div
      key="map"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-[620px] flex flex-col gap-3"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-amber-700" />
          <label className="text-xs text-stone-400">{t('map.selectChapter')}</label>
          <select
            value={selectedChapter.id}
            onChange={(e) => onSelectChapter(e.target.value)}
            className="bg-stone-900/60 border border-stone-700/50 rounded-lg px-3 py-1.5 text-sm text-stone-200 cursor-pointer hover:bg-stone-800/80 transition-colors"
          >
            {MAP_CHAPTERS.map((chapter) => {
              const unlocked = normalizedProgress.unlockedChapters.includes(chapter.id);
              return (
                <option key={chapter.id} value={chapter.id} disabled={!unlocked}>
                  {t(chapter.name)} {!unlocked ? '🔒' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/40 rounded-lg border border-stone-700/30">
            <Star size={10} className="text-amber-600" fill="currentColor" />
            <span className="text-stone-500">{t('map.totalStars')}:</span>
            <span className="text-amber-600 font-semibold">{totalStars}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/40 rounded-lg border border-stone-700/30">
            <span className="text-stone-500">{t('map.progress')}:</span>
            <span className="text-amber-600/80 font-semibold">{selectedChapterProgress.cleared}/{selectedChapterProgress.total}</span>
          </div>
        </div>
      </div>

      <MapViewport
        playerLevel={playerLevel}
        loading={loading}
        normalizedProgress={normalizedProgress}
        selectedChapter={selectedChapter}
        selectedChapterProgress={selectedChapterProgress}
        onEnterNode={onEnterNode}
      />
    </motion.div>
  );
}
