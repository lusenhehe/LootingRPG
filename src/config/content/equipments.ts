import csvRaw from './equipments.csv?raw';

export interface EquipmentTemplate {
  id: string;
  slot: string;
  quality: string;
  icon: string;
  nameZh: string;
  nameEn: string;
  specialZh?: string;
  specialEn?: string;
  attributes: Record<string, number>;
  affixes: Array<{ type: string; value: number }>;
  tags: string[];
  chance: number;
  weight: number;
  bossOnly: boolean;
  mapNode?: string;
  levelOffset: number;
  scalePerLevel: number;
}

const toBoolean = (value: string): boolean => ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase());

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonObject = (value: string): Record<string, number> => {
  if (!value.trim()) return {};
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const result: Record<string, number> = {};
  Object.entries(parsed as Record<string, unknown>).forEach(([key, raw]) => {
    const numberValue = Number(raw);
    if (Number.isFinite(numberValue)) {
      result[key] = numberValue;
    }
  });
  return result;
};

const parseAffixes = (value: string): Array<{ type: string; value: number }> => {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        type: String((entry as any)?.type ?? '').trim(),
        value: Number((entry as any)?.value ?? 0),
      }))
      .filter((entry) => entry.type.length > 0 && Number.isFinite(entry.value));
  } catch {
    return [];
  }
};

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const ch = line[index];
    const next = line[index + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
};

let cachedTemplates: EquipmentTemplate[] | null = null;

export const getEquipmentTemplates = (): EquipmentTemplate[] => {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (lines.length <= 1) {
    cachedTemplates = [];
    return [];
  }

  const header = parseCsvLine(lines[0]);

  const templates = lines.slice(1).map((line: string, rowIndex: number) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? '';
    });

    const id = row.id?.trim() || `csv_item_${rowIndex + 1}`;
    const chance = toNumber(row.chance, 1);

    return {
      id,
      slot: row.slot?.trim() || 'weapon',
      quality: row.quality?.trim() || 'common',
      icon: row.icon?.trim() || '🧰',
      nameZh: row.name_zh?.trim() || row.name_en?.trim() || id,
      nameEn: row.name_en?.trim() || row.name_zh?.trim() || id,
      specialZh: row.special_zh?.trim() || row.special_en?.trim() || undefined,
      specialEn: row.special_en?.trim() || row.special_zh?.trim() || undefined,
      attributes: parseJsonObject(row.attributes || ''),
      affixes: parseAffixes(row.affixes || ''),
      tags: (row.tags || '')
        .split('|')
        .join(',')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean),
      chance,
      weight: Math.max(0.01, toNumber(row.weight, 1)),
      bossOnly: toBoolean(row.bossOnly || ''),
      mapNode: row.mapNode?.trim() || undefined,
      levelOffset: Math.floor(toNumber(row.levelOffset, 0)),
      scalePerLevel: Math.max(0, toNumber(row.scalePerLevel, 0)),
    } satisfies EquipmentTemplate;
  });

  cachedTemplates = templates;
  return templates;
};
