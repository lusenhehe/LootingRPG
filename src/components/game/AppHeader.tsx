import { Coins, Heart, Shield, Download, LogOut, RefreshCw, Sword, Upload, Settings2, ChevronDown, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, memo } from 'react';
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
const commonStyles = {
  gradientBorder: "border border-stone-700/50",
  statBadge: "flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-sm",
  gradientBg: "bg-gradient-to-br",
  divider: "w-px h-8 bg-gradient-to-b from-transparent via-stone-700/50 to-transparent"
};
function AppHeaderInner({
  gold, playerName, playerStats,
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
    <header
      className="flex items-center justify-between h-14 px-4 border-b border-amber-900/25 bg-gradient-to-b from-[#120e09] via-stone-950 to-[#090705] shadow-lg shadow-black/70 relative overflow-hidden dark-emboss-header"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-950/5 via-transparent to-red-950/5 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />

      <div className="flex items-center gap-3 z-10">
        <div className="relative group">
          <div className={`w-9 h-9 ${commonStyles.gradientBg} from-amber-600 via-amber-700 to-amber-900 rounded flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30`}>
            <Sword className="text-amber-100" size={20} strokeWidth={2.5} />
          </div>
          <div className="absolute -inset-1 bg-amber-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-sm font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-sm tracking-wide text-embossed">
          LOOT GRINDER
        </span>
      </div>

      <div className="flex items-center gap-6 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center border border-indigo-700/30">
              <span className="text-xs font-bold text-indigo-300">{playerName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-stone-300">{playerName}</span>
            <span className="px-1.5 py-0.5 text-xs font-mono text-amber-400 border border-amber-700/30 rounded-sm">Lv.{playerStats.level}</span>
          </div>
          <div className="w-32 h-2 bg-stone-900 border border-amber-900/40 overflow-hidden clip-corner-8">
            <motion.div
              className="h-full relative xp-flame-flow"
              initial={{ width: 0 }}
              animate={{ width: `${expPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-sm" />
            </motion.div>
          </div>
        </div>
        
        <div className={commonStyles.divider} />
        
        <div className="grid grid-cols-2 gap-2">
          <div className={`${commonStyles.statBadge} bg-rose-500/10 border-rose-500/20`}> 
            <Sword size={11} className="text-rose-400" />
            <span className="text-rose-300 font-mono font-semibold">{playerStats.attack}</span>
          </div>
          <div className={`${commonStyles.statBadge} bg-emerald-500/10 border-emerald-500/20`}> 
            <Heart size={11} className="text-emerald-400" />
            <span className="text-emerald-300 font-mono font-semibold">{playerStats.hp}</span>
          </div>
          <div className={`${commonStyles.statBadge} bg-sky-500/10 border-sky-500/20`}> 
            <Shield size={11} className="text-sky-400" />
            <span className="text-sky-300 font-mono font-semibold">{playerStats.defense}</span>
          </div>
          <div className={`${commonStyles.statBadge} bg-amber-900/20 border-amber-700/30`}> 
            <Coins size={11} className="text-amber-400" />
            <span className="text-amber-300 font-mono font-semibold gold-pulse">{gold.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 z-10">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(63, 63, 70, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 p-2 text-stone-400 hover:text-stone-200 rounded-sm transition-all cursor-pointer app-header-settings-anchor border border-transparent hover:border-stone-700"
          >
            <Settings2 size={16} strokeWidth={2} />
            <ChevronDown size={11} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </motion.button>
          <MenuPortal
            show={showMenu}
            onClose={() => setShowMenu(false)}
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

export const AppHeader = memo(AppHeaderInner);

import type { Theme } from '../../config/themes/types';

interface MenuPortalProps {
  show: boolean;
  onClose: () => void;
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
        <div className="fixed inset-0 z-overlay" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          style={pos ? { position: 'fixed', top: pos.top, right: pos.right } : { position: 'fixed', top: 56, right: 16 }}
          className="z-modal bg-stone-900/98 backdrop-blur-xl rounded-sm border border-stone-700/50 shadow-2xl shadow-black/60 py-1 min-w-[160px] relative"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-amber-600/50 -translate-x-px -translate-y-px" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-amber-600/50 translate-x-px -translate-y-px" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-amber-600/50 -translate-x-px translate-y-px" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-amber-600/50 translate-x-px translate-y-px" />
          
          <button
            onClick={onExportSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer border-l-2 border-transparent hover:border-emerald-500/50"
          >
            <Download size={14} />
            导出存档
          </button>
          <button
            onClick={onImportSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer border-l-2 border-transparent hover:border-emerald-500/50"
          >
            <Upload size={14} />
            导入存档
          </button>
          <div className="my-1.5 border-t border-stone-800" />
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 font-medium">
              <Palette size={11} />
              <span>主题</span>
            </div>
            <div className="flex gap-1.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-sm border transition-all cursor-pointer ${
                    theme.id === t.id
                      ? 'bg-amber-900/30 border-amber-600/50 text-amber-300'
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
          <div className="my-1.5 border-t border-stone-800" />
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer border-l-2 border-transparent hover:border-blue-500/50"
          >
            <LogOut size={14} />
            切换玩家
          </button>
          <button
            onClick={onReset}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-l-2 border-transparent hover:border-rose-500/50"
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
