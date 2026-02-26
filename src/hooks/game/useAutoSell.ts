import { useState, useCallback } from 'react';
import { createAutoSellQualityMap } from '../../domains/inventory/services/autoSell';

/**
 * 自动售卖品质映射管理
 */
export function useAutoSell() {
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());

  const toggleQuality = useCallback((quality: string) => {
    setAutoSellQualities((prev) => ({ ...prev, [quality]: !prev[quality] }));
  }, []);

  return {
    autoSellQualities,
    toggleQuality,
    setAutoSellQualities,
  } as const;
}
