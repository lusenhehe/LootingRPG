export const chineseToEnglish: Record<string, string> = {
  等级: 'level',
  经验: 'xp',
  攻击力: 'attack',
  生命值: 'hp',
  防御力: 'defense',
  暴击率: 'critRate',
  伤害加成: 'damageBonus',
  吸血: 'lifesteal',
  反伤: 'thorns',
  元素伤害: 'elemental',
  攻击速度: 'attackSpeed',
  金币: 'gold',
  名称: 'name',
  品质: 'quality',
  部位: 'slot',
  属性: 'attributes',
  特殊效果: 'special',
  已装备: 'equipped',
};

// reverse mapping generated automatically
export const englishToChinese: Record<string, string> =
  Object.fromEntries(Object.entries(chineseToEnglish).map(([c, e]) => [e, c]));

/**
 * Converts an object's top‑level keys from Chinese to English using the map above.
 */
export function keysToEnglish<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [chineseToEnglish[k] ?? k, v])
  );
}

/**
 * Converts an object's top‑level keys from English back to Chinese.
 */
export function keysToChinese<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [englishToChinese[k] ?? k, v])
  );
}

/**
 * When writing helpers that iterate stat names, use this constant to list the
 * canonical English identifiers. The UI layer can then look up the Chinese
 * label only when rendering.
 */
export const canonicalStats = [
  'level',
  'xp',
  'attack',
  'hp',
  'defense',
  'critRate',
  'damageBonus',
  'lifesteal',
  'thorns',
  'elemental',
  'attackSpeed',
  'gold',
];

// recursion helpers for legacy save conversion
function convertEquipment(item: any): any {
  const r = keysToEnglish(item);
  if (r.attributes && typeof r.attributes === 'object') {
    r.attributes = keysToEnglish(r.attributes);
  }
  return r;
}

/**
 * Try to convert a possibly Chinese-keyed GameState object to the current
 * English-keyed shape. This is used when loading old saves or imported JSON.
 */
export function convertGameState(obj: any): any {
  const state = keysToEnglish(obj);
  if (state.playerStats && typeof state.playerStats === 'object') {
    state.playerStats = keysToEnglish(state.playerStats);
  }
  if (state.backpack && Array.isArray(state.backpack)) {
    state.backpack = state.backpack.map(convertEquipment);
  }
  if (state.currentEquipment && typeof state.currentEquipment === 'object') {
    state.currentEquipment = Object.fromEntries(
      Object.entries(state.currentEquipment).map(([k, v]) => [k, v ? convertEquipment(v) : null])
    );
  }
  if (state.pityCounts && typeof state.pityCounts === 'object') {
    state.pityCounts = keysToEnglish(state.pityCounts);
  }
  return state;
}
