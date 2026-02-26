import { LogIn, Plus, Trash2, User } from 'lucide-react';
import { useState, memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { SaveProfile } from '../../types/game';

interface LoginScreenProps {
  profiles: SaveProfile[];
  onLogin: (profileId: string) => void;
  onCreate: (name: string) => void;
  onDelete: (profileId: string) => void;
}

function LoginScreenInner({ profiles, onLogin, onCreate, onDelete }: LoginScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-red-900/30 blur-3xl rounded-full animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-rose-500/10 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-red-900/10 via-transparent to-transparent rounded-full" />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,22,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-[1] bg-[length:100%_4px,6px_100%]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10"
      >
        <section className="bg-gradient-to-br from-game-card/90 to-game-card/60 backdrop-blur-sm border border-game-border/50 rounded-2xl p-6 shadow-2xl shadow-red-900/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-900/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-xl font-display mb-1 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">{t('login.title')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('login.subtitle')}</p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {profiles.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-8 border border-dashed border-game-border/50 rounded-xl"
                >
                  <User size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">{t('login.noProfiles')}</p>
                </motion.div>
              )}
              {profiles.map((profile, index) => (
                <motion.div 
                  key={profile.id} initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between bg-game-bg/50 border border-game-border/50 rounded-xl px-3 py-3 hover:border-red-800/50 hover:bg-game-card/50 transition-all duration-200 cursor-pointer group"
                >
                  <button onClick={() => onLogin(profile.id)} className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-800/30 to-red-900/30 rounded-lg flex items-center justify-center">
                        <User size={14} className="text-red-400" />
                      </div>
                      <span className="font-semibold text-gray-200">{profile.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-10">{t('login.lastSaved')} {new Date(profile.updatedAt).toLocaleString()}</p>
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onLogin(profile.id)} 
                      className="px-2.5 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogIn size={12} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(profile.id)} 
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-game-card/90 to-game-card/60 backdrop-blur-sm border border-game-border/50 rounded-2xl p-6 shadow-2xl shadow-red-900/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-rose-500/5" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-xl font-display mb-1 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">{t('login.createTitle')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('login.createSubtitle')}</p>

            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('login.placeholder')}
                className="w-full bg-game-bg/50 border border-game-border/50 rounded-xl px-4 py-3 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700/50 text-sm transition-all placeholder:text-gray-600"
              />
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0_0_30px rgba(124, 58, 237, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const trimmed = name.trim();
                  if (!trimmed) return;
                  onCreate(trimmed);
                  setName('');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-800 to-red-900 text-white font-bold hover:brightness-110 hover:shadow-lg hover:shadow-red-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Plus size={16} className="relative z-10" /> 
                <span className="relative z-10">{t('login.createEnter')}</span>
              </motion.button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

export const LoginScreen = memo(LoginScreenInner);
