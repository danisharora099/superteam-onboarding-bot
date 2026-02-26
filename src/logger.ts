const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

let currentLevel: Level = "info";

export function setLogLevel(level: Level) {
  currentLevel = level;
}

function log(level: Level, message: string, data?: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...data,
  };

  const out = level === "error" ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) =>
    log("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) =>
    log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) =>
    log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) =>
    log("error", msg, data),
};
