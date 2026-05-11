type Context = Record<string, unknown>;

const formatContext = (context?: Context) =>
  context ? ` ${JSON.stringify(context)}` : "";

export const logger = {
  info(message: string, context?: Context) {
    console.info(`[batchflow] ${message}${formatContext(context)}`);
  },
  warn(message: string, context?: Context) {
    console.warn(`[batchflow] ${message}${formatContext(context)}`);
  },
  error(message: string, context?: Context) {
    console.error(`[batchflow] ${message}${formatContext(context)}`);
  },
};

