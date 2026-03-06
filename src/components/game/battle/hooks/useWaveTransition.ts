import { useState, useEffect, useRef } from 'react';

/**
 * 管理波次显示索引与切换过渡动画状态。
 * 当实际波次推进时，根据 delayMs 延迟后才切换显示以避免视觉突变。
 */
export function useWaveTransition(safeWaveIndex: number, waveOrderLength: number, delayMs: number) {
  const [displayWaveIndex, setDisplayWaveIndex] = useState(0);
  const [isWaveTransitioning, setIsWaveTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (displayWaveIndex === safeWaveIndex) return;
    if (safeWaveIndex < displayWaveIndex) {
      setDisplayWaveIndex(safeWaveIndex);
      setIsWaveTransitioning(false);
      return;
    }
    setIsWaveTransitioning(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayWaveIndex(safeWaveIndex);
      setIsWaveTransitioning(false);
    }, delayMs);
  }, [safeWaveIndex, displayWaveIndex, delayMs]);

  // 当 waveOrder 长度变化时，确保 displayWaveIndex 不越界
  useEffect(() => {
    if (waveOrderLength <= 0) return;
    setDisplayWaveIndex((prev) => {
      const maxIdx = Math.max(0, waveOrderLength - 1);
      return Math.max(0, Math.min(maxIdx, prev));
    });
  }, [waveOrderLength]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { displayWaveIndex, isWaveTransitioning };
}
