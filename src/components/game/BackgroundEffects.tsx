import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Skull, Home, Sword, Shield, Crown, Castle, Trees, Mountain, Flame, Moon, Sun } from 'lucide-react';

interface FloatingIcon {
  id: number;
  icon: React.ReactNode;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const rpgIcons = [
  { icon: <Home size={20} />, name: 'home' },
  { icon: <Castle size={24} />, name: 'castle' },
  { icon: <Mountain size={22} />, name: 'mountain' },
  { icon: <Trees size={20} />, name: 'trees' },
  { icon: <Skull size={18} />, name: 'skull' },
  { icon: <Ghost size={18} />, name: 'ghost' },
  { icon: <Sword size={16} />, name: 'sword' },
  { icon: <Shield size={18} />, name: 'shield' },
  { icon: <Crown size={18} />, name: 'crown' },
  { icon: <Flame size={16} />, name: 'flame' },
  { icon: <Moon size={20} />, name: 'moon' },
  { icon: <Sun size={20} />, name: 'sun' },
];

export function BackgroundEffects() {
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([]);
  const [torches, setTorches] = useState<{ id: number; x: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const iconData = rpgIcons[Math.floor(Math.random() * rpgIcons.length)];
      const newIcon: FloatingIcon = {
        id: Date.now(),
        icon: iconData.icon,
        x: Math.random() * 90 + 5,
        y: Math.random() * 70 + 15,
        size: Math.random() * 12 + 14,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 2,
      };
      setFloatingIcons(prev => [...prev.slice(-8), newIcon]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initialTorches = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 8 + i * 18,
    }));
    setTorches(initialTorches);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`torch-${i}`}
          className="absolute w-1 h-full bg-gradient-to-b from-amber-900/8 via-amber-800/4 to-transparent"
          style={{ left: `${8 + i * 18}%` }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {torches.map((torch) => (
        <motion.div
          key={torch.id}
          className="absolute"
          style={{ left: `${torch.x}%`, top: '10%' }}
        >
          <motion.div
            className="w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(180,83,9,0.08) 40%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2 + torch.id * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500/20"
            style={{ filter: 'blur(4px)' }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 1.5 + torch.id * 0.2,
              repeat: Infinity,
            }}
          />
        </motion.div>
      ))}

      <AnimatePresence>
        {floatingIcons.map((item) => (
          <motion.div
            key={item.id}
            className="absolute text-amber-700/50"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: item.size,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.6, 0.4, 0],
              y: -30,
              scale: [0.5, 1, 0.8],
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ 
              duration: item.duration, 
              delay: item.delay,
              ease: 'easeOut',
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="absolute right-8 top-1/4"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        <Moon size={48} className="text-stone-700/40" />
      </motion.div>

      <motion.div
        className="absolute left-4 bottom-1/3"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
        }}
      >
        <Castle size={36} className="text-stone-600/30" />
      </motion.div>

      <motion.div
        className="absolute right-1/4 bottom-20"
        animate={{
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      >
        <Trees size={28} className="text-stone-600/30" />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/60" />
      
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-game-bg via-game-bg/50 to-transparent" />
    </div>
  );
}
