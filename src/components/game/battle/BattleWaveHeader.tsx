import { Skull, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BattleSession } from '../../../shared/types/game';

interface BattleWaveHeaderProps {
  session: BattleSession;
  displayWaveIndex: number;
  waveOrderLength: number;
  isVictory: boolean;
  isDefeat: boolean;
}

export function BattleWaveHeader({
  session,
  displayWaveIndex,
  waveOrderLength,
  isVictory,
  isDefeat,
}: BattleWaveHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-red-900/40 to-stone-900/60 border border-red-700/30 flex items-center justify-center">
            <Skull size={20} className="text-red-400" />
          </div>
          <div>
            <div className="text-[10px] font-display uppercase text-stone-500 tracking-[0.3em] flex items-center gap-2">
              <ChevronRight size={10} />
              <span>{session.chapterName}</span>
            </div>
            <div className="text-lg font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-stone-200 to-stone-300">
              {t('battle.title')}
            </div>
            <div className="text-[10px] font-mono text-stone-500 uppercase tracking-[0.2em]">
              {session.nodeName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Wave</div>
            <div className="text-xl font-display font-bold text-amber-500">
              {Math.min(displayWaveIndex + 1, waveOrderLength)}
              <span className="text-stone-600 text-sm">/{waveOrderLength}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Turn</div>
            <div className="text-xl font-display font-bold text-stone-300">{session.turn}</div>
          </div>
          {isVictory && (
            <div className="px-3 py-1.5 bg-emerald-900/30 border border-emerald-600/40 rounded-sm">
              <span className="text-emerald-400 font-display text-sm font-bold">VICTORY</span>
            </div>
          )}
          {isDefeat && (
            <div className="px-3 py-1.5 bg-red-900/30 border border-red-600/40 rounded-sm">
              <span className="text-red-400 font-display text-sm font-bold">DEFEATED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
