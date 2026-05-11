export const calculateRetryDelayMs = (
  baseDelayMs: number,
  retryCount: number,
) => baseDelayMs * 2 ** retryCount;

export const calculateRetryAt = (
  baseDelayMs: number,
  retryCount: number,
  now = Date.now(),
) => now + calculateRetryDelayMs(baseDelayMs, retryCount);

