import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://:sg1rGtZFT5AuUI9tQpDOXm74JmrJ7kca@test-redis-fp2fe6:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export default redisClient;