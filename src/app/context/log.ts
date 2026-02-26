export interface LogContext {
  logs: string[];
  addLog: (msg: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}