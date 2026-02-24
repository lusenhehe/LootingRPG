import { Coins, Download, LogOut, RefreshCw, Sword, Upload, Settings2, ChevronDown, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PlayerStats } from '../../types/game';
import { useTheme } from '../../config/themes/ThemeContext';

interface AppHeaderProps {
  gold: number;
  playerName: string;
  playerStats: PlayerStats;
  onReset: () => void;
  onLogout: () => void;
  onExportSave: () => void;
  onImportSave: () => void;
}

export function AppHeader({
  gold,
  playerName,
  playerStats,
  onReset,
  onLogout,
  onExportSave,
  onImportSave,
}: AppHeaderProps) {
  const { theme, themes, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const expNeeded = playerStats.level * 100;
  const expPercent = Math.min(100, (playerStats.xp / expNeeded) * 100);

  return (
    <header className="flex items-center justify-between gap-4 h-16 px-5 border-b border-white/5 bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30">
              <Sword className="text-amber-100" size={22} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full border-2 border-stone-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-sm">
              LOOT GRINDER
            </span>
            <span className="text-[9px] font-medium tracking-[0.2em] text-stone-500 uppercase">Rare Earth Explorer</span>
          </div>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-stone-700/50 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-stone-800/40 rounded-xl border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-800/30 to-red-900/30 flex items-center justify-center border border-red-700/20">
              <span className="text-xs font-bold text-indigo-300">{playerName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-stone-200">{playerName}</span>
            <span className="px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 rounded-md shadow-inner">Lv.{playerStats.level}</span>
          </div>

          <div className="flex items-center gap-2 w-28">
            <div className="flex-1 h-2 rounded-full bg-stone-800 border border-stone-700/50 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 relative"
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
              </motion.div>
            </div>
            <span className="text-[10px] text-stone-500 font-mono w-12 text-right">{playerStats.xp}/{expNeeded}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 rounded-md border border-rose-500/20">
              <Sword size={12} className="text-rose-400" />
              <span className="text-rose-300 font-semibold">{playerStats.attack}</span>
              <span className="text-stone-600 font-normal">ATK</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
              <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-400/50" />
              <span className="text-emerald-300 font-semibold">{playerStats.hp}</span>
              <span className="text-stone-600 font-normal">HP</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-sky-500/10 rounded-md border border-sky-500/20">
              <div className="w-3 h-1.5 rounded-sm bg-sky-400/50" />
              <span className="text-sky-300 font-semibold">{playerStats.defense}</span>
              <span className="text-stone-600 font-normal">DEF</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/30 to-amber-800/20 rounded-xl border border-amber-700/30 shadow-lg shadow-amber-900/10">
          <Coins className="text-amber-400" size={16} strokeWidth={2} />
          <span className="font-mono font-bold text-amber-400 text-sm tracking-wide">{gold.toLocaleString()}</span>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 p-2.5 text-stone-400 hover:text-stone-200 rounded-lg transition-all cursor-pointer app-header-settings-anchor"
          >
            <Settings2 size={18} strokeWidth={2} />
            <ChevronDown size={12} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </motion.button>
          <MenuPortal
            show={showMenu}
            onClose={() => setShowMenu(false)}
            anchorRef={undefined as any}
            onExportSave={() => { onExportSave(); setShowMenu(false); }}
            onImportSave={() => { onImportSave(); setShowMenu(false); }}
            onLogout={() => { onLogout(); setShowMenu(false); }}
            onReset={() => { onReset(); setShowMenu(false); }}
            theme={theme}
            themes={themes}
            onThemeChange={(id) => { setTheme(id); setShowMenu(false); }}
          />
        </div>
      </div>
    </header>
  );
}

import type { Theme } from '../../config/themes/types';

interface MenuPortalProps {
  show: boolean;
  onClose: () => void;
  anchorRef?: any;
  onExportSave: () => void;
  onImportSave: () => void;
  onLogout: () => void;
  onReset: () => void;
  theme: Theme;
  themes: Theme[];
  onThemeChange: (id: string) => void;
}

function MenuPortal({
  show,
  onClose,
  anchorRef,
  onExportSave,
  onImportSave,
  onLogout,
  onReset,
  theme,
  themes,
  onThemeChange,
}: MenuPortalProps) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!show) return;
    const update = () => {
      try {
        const anchor = document.querySelector('.app-header-settings-anchor') as HTMLElement | null;
        if (!anchor) return;
        const r = anchor.getBoundingClientRect();
        setPos({ top: r.bottom, right: window.innerWidth - r.right });
      } catch (e) {
        setPos({ top: 56, right: 16 });
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <AnimatePresence>
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          style={pos ? { position: 'fixed', top: pos.top, right: pos.right } : { position: 'fixed', top: 64, right: 20 }}
          className="z-[9999] bg-stone-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/40 py-1.5 min-w-[160px]"
        >
          <button
            onClick={onExportSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
          >
            <Download size={15} />
            导出存档
          </button>
          <button
            onClick={onImportSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
          >
            <Upload size={15} />
            导入存档
          </button>
          <div className="my-1.5 border-t border-white/5" />
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <Palette size={12} />
              <span>主题</span>
            </div>
            <div className="flex gap-1.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-all cursor-pointer ${
                    theme.id === t.id
                      ? 'bg-stone-700/80 border-stone-500 text-stone-100'
                      : 'bg-stone-800/50 border-stone-700/50 text-stone-400 hover:border-stone-600 hover:text-stone-300'
                  }`}
                  style={{
                    borderColor: theme.id === t.id ? t.colors.gameAccent : undefined,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="my-1.5 border-t border-white/5" />
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
          >
            <LogOut size={15} />
            切换玩家
          </button>
          <button
            onClick={onReset}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <RefreshCw size={15} />
            重置存档
          </button>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body,
  );
}
