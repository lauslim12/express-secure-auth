import type { WrappedNodeRedisClient } from 'handy-redis';

import type { Repository } from './domain';

/**
 * Authentication repository.
 */
class AuthRepository implements Repository {
  private redis: WrappedNodeRedisClient;

  constructor(redis: WrappedNodeRedisClient) {
    this.redis = redis;
  }

  /**
   * Creates a mapping to know whether the user who is logged in is valid or not.
   * Can be easily revoked by an administrator in the Redis datastore.
   * Expiry date is set to 24 hours, the same as the JWT expiry.
   *
   * @param userId - A user's ID
   * @param sessionKey - A session key
   */
  async insertToSession(userId: string, sessionKey: string) {
    await this.redis.setex(`sess:${sessionKey}`, 86400, userId);
  }

  /**
   * Gets a single session from the available mapping created at 'insertToSession'.
   *
   * @param sessionKey - A session key from the JWT
   * @returns User's ID if it exists, else returns null
   */
  async getFromSession(sessionKey: string) {
    return await this.redis.get(`sess:${sessionKey}`);
  }
}

export default AuthRepository;
