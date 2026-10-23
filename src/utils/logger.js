// ** minimal leveled logger, swap with pino/winston later without touching callers
const format = (level, args) => [`[${new Date().toISOString()}] ${level}`, ...args];

const logger = {
  info: (...args) => console.log(...format("INFO", args)),
  warn: (...args) => console.warn(...format("WARN", args)),
  error: (...args) => console.error(...format("ERROR", args)),
};

export default logger;
