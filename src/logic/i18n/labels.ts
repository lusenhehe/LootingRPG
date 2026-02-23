import { t } from 'i18next';

export const getQualityLabel = (qualityKey: string): string => t(`quality.${qualityKey}`);
export const getSlotLabel = (slotKey: string): string => t(`slot.${slotKey}`);
export const getStatLabel = (statKey: string): string => t(`stat.${statKey}`);
