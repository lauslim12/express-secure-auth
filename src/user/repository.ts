import type { WrappedNodeRedisClient } from 'handy-redis';

import type { Repository, User } from './domain';

/**
 * Personification of a DAO in Data Access Layer.
 */
class UserRepository implements Repository {
  private redis: WrappedNodeRedisClient;

  constructor(redis: WrappedNodeRedisClient) {
    this.redis = redis;
  }

  /**
   * Fetches all data of the users that are registered in this system.
   *
   * @returns All users data
   */
  async fetchUsers() {
    const userIds = await this.redis.smembers('users');
    const users = await Promise.all(
      userIds.map((id) => this.redis.hgetall(`user:${id}`))
    );

    return users as User[];
  }

  /**
   * Fetches a single user from the database by identification.
   *
   * @param id - ID of the user
   * @returns A single user's data
   */
  async fetchUser(id: string) {
    const user = await this.redis.hgetall(`user:${id}`);
    if (!user) {
      return null;
    }

    return user as User;
  }

  /**
   * Fetches a single user by his/her username.
   *
   * @param username - A user's username
   * @returns A single user's data
   */
  async fetchUserByUsername(username: string) {
    const userId = await this.redis.hget('username-uid', username);
    const user = await this.redis.hgetall(`user:${userId}`);
    if (!user) {
      return null;
    }

    return user as User;
  }

  /**
   * Inserts a single user into the database.
   *
   * @param user - A single user's data
   * @returns The added user
   */
  async insertUser(user: User) {
    await Promise.all([
      this.redis.sadd('users', user.id),
      this.redis.hset(`user:${user.id}`, ...Object.entries(user)),
      this.redis.hset('username-uid', [user.username, user.id]),
    ]);

    return user as User;
  }

  /**
   * Updates a single user data that is in the database.
   * Also takes care of data replacement - that is removing the old data and replacing it with the updated one.
   *
   * @param id - The user's ID
   * @param user - The data to overwrite the previous one
   * @returns The newly updated data of the user
   */
  async updateUser(id: string, user: Partial<User>) {
    const previousUser = (await this.redis.hgetall(`user:${id}`)) as User;
    if (user.username) {
      await Promise.all([
        this.redis.hdel('username-uid', previousUser.username),
        this.redis.hset('username-uid', [user.username, previousUser.id]),
      ]);
    }

    await this.redis.hset(`user:${id}`, ...Object.entries(user));
    const updatedUser = await this.redis.hgetall(`user:${id}`);

    return updatedUser as User;
  }

  /**
   * Deletes a single user in the database.
   *
   * @param id - The user's ID
   * @returns None, as deletion is 204 No Content
   */
  async deleteUser(id: string) {
    const username = await this.redis.hget(`user:${id}`, 'username');
    if (!username) {
      return;
    }

    await Promise.all([
      this.redis.srem('users', id),
      this.redis.del(`user:${id}`),
      this.redis.hdel('username-uid', username),
    ]);
  }
}

export default UserRepository;
