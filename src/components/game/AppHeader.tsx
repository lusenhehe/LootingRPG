import { Coins, Download, LogOut, RefreshCw, Sword, Upload, Settings2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import type { PlayerStats } from '../../types/game';

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
  const [showMenu, setShowMenu] = useState(false);
  const expNeeded = playerStats.等级 * 100;
  const expPercent = Math.min(100, (playerStats.经验 / expNeeded) * 100);

  return (
    <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-stone-700/50 bg-gradient-to-b from-stone-900/90 to-stone-950/90 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/30 border border-amber-600/30">
            <Sword className="text-amber-200" size={20} />
          </div>
          <span className="text-lg font-display font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 fantasy-text">
            LOOT GRINDER
          </span>
        </div>

        <div className="w-px h-6 bg-stone-700/50" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-800/50 rounded-lg border border-stone-700/50">
            <span className="text-sm text-stone-300">{playerName}</span>
            <span className="text-xs font-bold text-amber-500">Lv.{playerStats.等级}</span>
          </div>

          <div className="flex items-center gap-2 w-24">
            <div className="flex-1 h-1.5 rounded-full bg-stone-800 border border-stone-700/50 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-800 to-amber-600 relative"
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-amber-400/20" />
              </motion.div>
            </div>
            <span className="text-[10px] text-stone-500 font-mono w-10">{playerStats.经验}/{expNeeded}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-rose-400 font-semibold">{playerStats.攻击力} <span className="text-stone-500 font-normal">ATK</span></span>
            <span className="text-emerald-400 font-semibold">{playerStats.生命值} <span className="text-stone-500 font-normal">HP</span></span>
            <span className="text-sky-400 font-semibold">{playerStats.防御力} <span className="text-stone-500 font-normal">DEF</span></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 rounded-lg border border-amber-700/30">
          <Coins className="text-amber-500" size={14} />
          <span className="font-mono font-bold text-amber-500 text-sm">{gold.toLocaleString()}</span>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 rounded-lg transition-colors cursor-pointer"
          >
            <Settings2 size={16} />
            <ChevronDown size={12} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-stone-900/95 backdrop-blur-xl rounded-lg border border-stone-700/50 shadow-xl py-1 min-w-[140px]"
                >
                  <button
                    onClick={() => { onExportSave(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    导出存档
                  </button>
                  <button
                    onClick={() => { onImportSave(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    导入存档
                  </button>
                  <div className="my-1 border-t border-stone-700/30" />
                  <button
                    onClick={() => { onLogout(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    切换玩家
                  </button>
                  <button
                    onClick={() => { onReset(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    重置存档
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
