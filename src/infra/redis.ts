import { createNodeRedisClient } from 'handy-redis';

import config from '../config';

/**
 * Creates a Redis instance to be used by the application.
 *
 * @returns Redis instance
 */
const redis = createNodeRedisClient({
  host: config.NODE_ENV === 'production' ? 'redis' : 'localhost',
});

/**
 * Set up pub/sub listeners.
 */
redis.nodeRedis.on('error', (err) =>
  console.error('An error occurred when setting up Redis. Error:', err)
);
redis.nodeRedis.on('connect', () =>
  console.log('Successfully connected to the Redis instance!')
);
redis.nodeRedis.on('ready', () => console.log('Redis is now ready to work!'));

export default redis;
