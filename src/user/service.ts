import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { nanoid } from 'nanoid/async';

import type { Repository, Service, User } from './domain';

/**
 * Generates a single password using either BCRYPT or SHA512 algorithm.
 *
 * @param raw - Raw user's password
 * @returns A hashed password
 */
const generatePassword = async (raw: string) => {
  if (process.env.PASSWORD_HASH === 'sha512' && process.env.PASSWORD_SALT) {
    return crypto
      .createHmac('sha512', process.env.PASSWORD_SALT)
      .update(raw)
      .digest('hex');
  }

  return await bcrypt.hash(raw, 14);
};

/**
 * Personification of the 'Service' layer.
 */
class UserService implements Service {
  private userRepository: Repository;

  constructor(userRepository: Repository) {
    this.userRepository = userRepository;
  }

  /**
   * Gets all users of this application.
   *
   * @returns All users of this application
   */
  async getUsers() {
    const users = await this.userRepository.fetchUsers();
    const strippedUsers = users.map((user) => ({
      ...user,
      password: undefined,
    }));

    return strippedUsers;
  }

  /**
   * Gets a single user object.
   *
   * @param id - A single user's ID
   * @returns A user
   */
  async getUser(id: string) {
    const user = await this.userRepository.fetchUser(id);
    if (!user) {
      return null;
    }

    return { ...user, password: undefined };
  }

  /**
   * Fetches a single user by his/her username.
   *
   * @param username - A user's username
   * @returns A user
   */
  async getUserByUsername(username: string) {
    const user = await this.userRepository.fetchUserByUsername(username);
    if (!user) {
      return null;
    }

    return { ...user, password: undefined };
  }

  /**
   * Creates a single user.
   *
   * @param user - A user object
   * @returns A single newly created user
   */
  async createUser(user: User) {
    user.id = await nanoid();
    user.password = await generatePassword(user.password);
    user.changedPasswordAfter = Date.now().toString();
    user.created = Date.now().toString();
    user.updated = Date.now().toString();

    const newUser = await this.userRepository.insertUser(user);

    return { ...newUser, password: undefined };
  }

  /**
   * Modifies a single user object.
   *
   * @param id - A user's ID
   * @param user - A user object to overwrite the previous one
   * @returns A single, newly updated user
   */
  async modifyUser(id: string, user: Partial<User>) {
    if (user.password) {
      user.password = await generatePassword(user.password);
      user.changedPasswordAfter = Date.now().toString();
    }

    user.updated = Date.now().toString();
    const updatedUser = await this.userRepository.updateUser(id, user);

    return { ...updatedUser, password: undefined };
  }

  /**
   * Deletes a single user.
   *
   * @param id - A user's ID
   * @returns Null, as this operation does not need to return anything
   */
  async removeUser(id: string) {
    await this.userRepository.deleteUser(id);
  }
}

export default UserService;
