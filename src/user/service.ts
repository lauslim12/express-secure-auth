import { nanoid } from 'nanoid/async';

import config from '../config';
import { createArgon2Hash } from '../crypto/argon2';
import { createBCRYPTHash } from '../crypto/bcrypt';
import genSalt from '../crypto/genSalt';
import { createPBKDF2Hash } from '../crypto/pbkdf2';
import { createSCRYPTHash } from '../crypto/scrypt';
import createSHA512HMAC from '../crypto/sha512';
import type { Repository, Service, User } from './domain';

/**
 * Generates a secure password with relevant algorithms.
 * Raw passwords are normalized to prevent difference between composed or decomposed characters.
 * All inputs in my custom 'crypto' module are customized with 'normalize()' already.
 * See: https://nodejs.org/api/crypto.html#using-strings-as-inputs-to-cryptographic-apis.
 *
 * @param raw - Raw user's password
 * @param salt - A random salt
 * @returns Function to generate a password based on chosen algorithm
 */
const generatePassword = async (raw: string, salt: string) => {
  const { PASSWORD_ALGORITHM: algorithm } = config;
  if (algorithm === 'argon2') {
    return createArgon2Hash(raw);
  }

  if (algorithm === 'bcrypt') {
    return createBCRYPTHash(raw);
  }

  if (algorithm === 'pbkdf2') {
    return createPBKDF2Hash(raw, salt, 'sha512', 1_000_000, 64);
  }

  if (algorithm === 'scrypt') {
    return createSCRYPTHash(raw, salt, 64);
  }

  return createSHA512HMAC(raw, salt);
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

    return users.map((user) => ({
      ...user,
      password: undefined,
      salt: undefined,
      changedPasswordAfter: undefined,
    }));
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

    return {
      ...user,
      password: undefined,
      salt: undefined,
      changedPasswordAfter: undefined,
    };
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

    return {
      ...user,
      password: undefined,
      salt: undefined,
      changedPasswordAfter: undefined,
    };
  }

  /**
   * Returns a user's complete data.
   *
   * @param id - A user's ID
   * @returns A user, their complete data
   */
  async getUserComplete(id: string) {
    const user = await this.userRepository.fetchUser(id);
    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * Creates a single user.
   *
   * @param user - A user object
   * @returns A single newly created user
   */
  async createUser(user: User) {
    const u = { ...user };

    u.id = await nanoid();
    u.salt = await genSalt(24, config.PASSWORD_PEEPER);
    u.password = await generatePassword(user.password, user.salt);
    u.changedPasswordAfter = Date.now().toString();
    u.created = Date.now().toString();
    u.updated = Date.now().toString();

    const newUser = await this.userRepository.insertUser(u);

    return {
      ...newUser,
      password: undefined,
      salt: undefined,
      changedPasswordAfter: undefined,
    };
  }

  /**
   * Modifies a single user object.
   *
   * @param id - A user's ID
   * @param user - A user object to overwrite the previous one
   * @returns A single, newly updated user
   */
  async modifyUser(id: string, user: Partial<User>) {
    const u = { ...user };

    if (u.password) {
      u.salt = await genSalt(24, config.PASSWORD_PEEPER);
      u.password = await generatePassword(u.password, u.salt);
      u.changedPasswordAfter = Date.now().toString();
    }

    u.updated = Date.now().toString();
    const updatedUser = await this.userRepository.updateUser(id, u);

    return {
      ...updatedUser,
      password: undefined,
      salt: undefined,
      changedPasswordAfter: undefined,
    };
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
