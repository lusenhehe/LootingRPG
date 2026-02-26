import { useState, useCallback } from 'react';

/**
 * 简单的日志管理 hook，负责维护消息列表和添加新日志。
 * 由各个业务 hook/组件调用，用于在界面上显示运行时信息。
 */
export function useGameLogger(initialLogs: string[] = ['[System] Game started.']) {
  const [logs, setLogs] = useState<string[]>(initialLogs);

  const addLog = useCallback((msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  }, []);

  return {
    logs,
    setLogs,
    addLog,
  } as const;
}
