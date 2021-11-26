import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid/async';

import config from '../config';
import { verifyArgon2Hash } from '../crypto/argon2';
import { verifyBCRYPTHash } from '../crypto/bcrypt';
import createPBKDF2Hash from '../crypto/pbkdf2';
import safeCompare from '../crypto/safeCompare';
import createSCRYPTHash from '../crypto/scrypt';
import createSHA512HMAC from '../crypto/sha512';
import type { Repository as UserRepo } from '../user/domain';
import type { Auth, Repository as AuthRepo, Service } from './domain';

/**
 * Generates (async) a JWT token that is valid for a single day. Token cannot be used before the specified 'notBefore'.
 * The 'notBefore' attribute is used to prevent brute-force attacks.
 *
 * @param username - A user's username
 * @param sessionKey - A unique session key
 * @returns Signed JWT token
 */
const generateJWT = async (
  username: string,
  sessionKey: string
): Promise<string> => {
  const options: SignOptions = {
    algorithm: 'HS256',
    audience: 'if673-general-population',
    issuer: 'esa-nhy',
    expiresIn: 86400,
    subject: username,
    notBefore: 0,
  };

  const payload: JwtPayload = {
    sess: sessionKey,
  };

  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.JWT_SECRET, options, (err, decoded) => {
      if (err) {
        return reject(err);
      }

      if (!decoded) {
        return reject('Invalid signing problem detected.');
      }

      return resolve(decoded);
    });
  });
};

/**
 * Compares passwords that have no need for manual salt.
 *
 * @param checked - A password from the database
 * @param input - A password from the user
 * @returns Boolean value whether passwords match or not
 */
const compareAutoSaltPasswords = async (checked: string, input: string) => {
  if (config.PASSWORD_ALGORITHM === 'argon2') {
    return await verifyArgon2Hash(checked, input);
  }

  return await verifyBCRYPTHash(checked, input);
};

/**
 * Compares passwords that have to have manual salt.
 * For manual salts, we have to create a representation of that password in the form of the algorithm.
 * After that, we can compare.
 *
 * @param checked - A password from the database
 * @param input - A password from the user
 * @param salt - A salt from the database
 * @returns Boolean value whether passwords match or not
 */
const compareManualSaltPasswords = async (
  checked: string,
  input: string,
  salt: string
) => {
  if (config.PASSWORD_ALGORITHM === 'pbkdf2') {
    const userInput = await createPBKDF2Hash(input, salt);
    const isPasswordValid = safeCompare(userInput, checked);
    if (isPasswordValid) {
      return true;
    }

    return false;
  }

  if (config.PASSWORD_ALGORITHM === 'scrypt') {
    const userInput = await createSCRYPTHash(input, salt);
    const isPasswordValid = safeCompare(userInput, checked);
    if (isPasswordValid) {
      return true;
    }

    return false;
  }

  // compare sha512
  const passwordInput = createSHA512HMAC(input, salt);
  return safeCompare(checked, passwordInput);
};

/**
 * Compares whether passwords match or not depending on the current used algorithm.
 *
 * @param checked - A password from the database
 * @param input - A password from the user
 * @param salt - A salt from the database
 * @returns Boolean value whether passwords match or not
 */
const comparePasswords = async (
  checked: string,
  input: string,
  salt: string
) => {
  const { PASSWORD_ALGORITHM } = config;
  if (PASSWORD_ALGORITHM === 'argon2' || PASSWORD_ALGORITHM === 'bcrypt') {
    return await compareAutoSaltPasswords(checked, input);
  }

  return await compareManualSaltPasswords(checked, input, salt);
};

/**
 * Authentication services.
 */
class AuthService implements Service {
  private userRepository: UserRepo;
  private authRepository: AuthRepo;

  constructor(userRepo: UserRepo, authRepo: AuthRepo) {
    this.authRepository = authRepo;
    this.userRepository = userRepo;
  }

  /**
   * Logs in a user.
   *
   * @param auth - Authentication credentials
   * @returns Token or a null value if authentication fails.
   */
  async login(auth: Auth) {
    // check whether username exists
    const checkedUser = await this.userRepository.fetchUserByUsername(
      auth.username
    );
    if (!checkedUser) {
      return null;
    }

    // check whether passwords match safely
    const isPasswordCorrect = await comparePasswords(
      checkedUser.password,
      auth.password,
      checkedUser.salt
    );
    if (!isPasswordCorrect) {
      return null;
    }

    // generate token and unique session key
    const sessionKey = await nanoid();
    const token = await generateJWT(auth.username, sessionKey);

    // map session key to redis datastore
    await this.authRepository.insertToSession(checkedUser.id, sessionKey);

    // returns token
    return token;
  }

  /**
   * Logs out a user.
   *
   * @param sessionKey - A user's session key
   */
  async logout(sessionKey: string) {
    await this.authRepository.removeFromSession(sessionKey);
  }

  /**
   * Inserts a user's data to the session.
   *
   * @param userId - A user's identification
   * @param sessionKey - A randomly generated session key
   */
  async insertToSession(userId: string, sessionKey: string) {
    await this.authRepository.insertToSession(userId, sessionKey);
  }

  /**
   * Gets a user's identification mapping from the session.
   *
   * @param sessionKey - A randomly generated session key
   * @returns User ID if exists
   */
  async getFromSession(sessionKey: string) {
    const session = await this.authRepository.getFromSession(sessionKey);
    if (!session) {
      return null;
    }

    return session;
  }
}

export default AuthService;
