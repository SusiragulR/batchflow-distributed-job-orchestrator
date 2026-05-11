local retryQueue = KEYS[1]
local readyQueue = KEYS[2]
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])

local jobs = redis.call("ZRANGEBYSCORE", retryQueue, "-inf", now, "LIMIT", 0, limit)

for _, payload in ipairs(jobs) do
  redis.call("LPUSH", readyQueue, payload)
  redis.call("ZREM", retryQueue, payload)
end

return jobs

