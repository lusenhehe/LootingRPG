import { Coins, Download, LogOut, RefreshCw, Sword, Upload } from 'lucide-react';
import { motion } from 'motion/react';

interface AppHeaderProps {
  gold: number;
  playerName: string;
  onReset: () => void;
  onLogout: () => void;
  onExportSave: () => void;
  onImportSave: () => void;
}

export function AppHeader({
  gold,
  playerName,
  onReset,
  onLogout,
  onExportSave,
  onImportSave,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-game-border/50 pb-4 relative">
      <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-3 relative z-10">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 3 }}
          className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 neon-border"
        >
          <Sword className="text-white drop-shadow-lg" size={26} />
        </motion.div>
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 neon-text"
          >
            LOOT GRINDER
          </motion.h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 tracking-widest font-mono">玩家:</span>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold text-violet-300"
            >
              {playerName}
            </motion.span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 px-4 py-2 rounded-xl border border-amber-500/40 shadow-lg shadow-amber-500/10 cursor-pointer hover:shadow-amber-500/20 transition-all"
        >
          <Coins className="text-yellow-400 drop-shadow-lg" size={18} />
          <span className="font-mono font-bold text-yellow-400 text-lg">{gold.toLocaleString()}</span>
        </motion.div>
        
        <div className="flex items-center gap-1 bg-game-card/50 rounded-xl p-1 border border-game-border/30">
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
            whileTap={{ scale: 0.95 }}
            onClick={onExportSave} 
            className="p-2.5 text-gray-400 transition-all duration-200 rounded-lg cursor-pointer" 
            title="导出存档"
          >
            <Download size={18} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
            whileTap={{ scale: 0.95 }}
            onClick={onImportSave} 
            className="p-2.5 text-gray-400 transition-all duration-200 rounded-lg cursor-pointer" 
            title="导入存档"
          >
            <Upload size={18} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout} 
            className="p-2.5 text-gray-400 transition-all duration-200 rounded-lg cursor-pointer" 
            title="切换玩家"
          >
            <LogOut size={18} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset} 
            className="p-2.5 text-gray-400 transition-all duration-200 rounded-lg cursor-pointer" 
            title="重置存档"
          >
            <RefreshCw size={20} />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
