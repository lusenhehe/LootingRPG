// UI 图标和样式配置
// 包含装备槽位图标、品质样式等共享配置

// 装备槽位 emoji 映射
export const SLOT_EMOJI_MAP: Record<string, string> = {
  weapon: '🗡️',
  helmet: '👑',
  armor: '🛡️',
  ring: '💍',
  necklace: '📿',
  boots: '👢',
};

// 装备品质样式映射（基础版本，用于图鉴和详情面板）
export const QUALITY_STYLE_MAP_BASE: Record<string, { border: string; bg: string; hex: string; text: string }> = {
  common:    { border: 'border-stone-600',  bg: 'bg-stone-900/60',  hex: '#78716c', text: 'text-stone-300' },
  uncommon:  { border: 'border-green-500',  bg: 'bg-green-950/40',  hex: '#22c55e', text: 'text-green-300' },
  rare:      { border: 'border-blue-400',   bg: 'bg-blue-950/40',   hex: '#3b82f6', text: 'text-blue-300'  },
  epic:      { border: 'border-purple-400', bg: 'bg-purple-950/40', hex: '#a855f7', text: 'text-purple-300' },
  legendary: { border: 'border-amber-400',  bg: 'bg-amber-950/40',  hex: '#f59e0b', text: 'text-amber-300' },
  mythic:    { border: 'border-red-500',    bg: 'bg-red-950/40',    hex: '#ef4444', text: 'text-red-300'   },
};

// 装备品质样式映射（增强版本，包含发光效果，用于背包格子）
export const QUALITY_STYLE_MAP_ENHANCED: Record<string, { border: string; bg: string; glow: string; hex: string }> = {
  common:    { border: 'border-stone-600',  bg: 'bg-stone-900/60',  glow: '',                    hex: '#78716c' },
  uncommon:  { border: 'border-green-500',  bg: 'bg-green-950/40',  glow: 'shadow-green-500/20', hex: '#22c55e' },
  rare:      { border: 'border-blue-400',   bg: 'bg-blue-950/40',   glow: 'shadow-blue-500/20',  hex: '#3b82f6' },
  epic:      { border: 'border-purple-400', bg: 'bg-purple-950/40', glow: 'shadow-purple-500/40',hex: '#a855f7' },
  legendary: { border: 'border-amber-400',  bg: 'bg-amber-950/40',  glow: 'shadow-amber-500/40', hex: '#f59e0b' },
  mythic:    { border: 'border-red-500',    bg: 'bg-red-950/40',    glow: 'shadow-red-500/30',   hex: '#ef4444' },
};

// 装备品质样式映射（tooltip版本，用于装备槽tooltip）
export const QUALITY_STYLE_MAP_TOOLTIP: Record<string, { bg: string; border: string; text: string; glow: string; hexColor: string }> = {
  common:   { bg: 'from-stone-600 to-stone-700', border: 'border-stone-500', text: 'text-stone-300', glow: 'shadow-stone-500/20', hexColor: '#78716c' },
  uncommon: { bg: 'from-green-700 to-green-800', border: 'border-green-500', text: 'text-green-300', glow: 'shadow-green-500/30', hexColor: '#22c55e' },
  rare:     { bg: 'from-blue-700 to-blue-800', border: 'border-blue-400', text: 'text-blue-300', glow: 'shadow-blue-500/30', hexColor: '#3b82f6' },
  epic:     { bg: 'from-purple-700 to-purple-800', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-500/50', hexColor: '#a855f7' },
  legendary:{ bg: 'from-amber-600 to-amber-700', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-500/50', hexColor: '#f59e0b' },
  mythic:   { bg: 'from-red-700 to-red-800', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/40', hexColor: '#991b1b' },
};
// 威胁类型样式映射
export const THREAT_STYLE_MAP: Record<string, string> = {
  burst_punish:      'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-200',
  sustain_pressure:  'border-rose-400/35 bg-rose-500/10 text-rose-200',
  tank_breaker:      'border-amber-400/35 bg-amber-500/10 text-amber-200',
  attrition:         'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
};