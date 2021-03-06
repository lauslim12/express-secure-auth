import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid/async';

import config from '../config';
import { verifyArgon2Hash } from '../crypto/argon2';
import { verifyBCRYPTHash } from '../crypto/bcrypt';
import { verifyPBKDF2 } from '../crypto/pbkdf2';
import safeCompare from '../crypto/safeCompare';
import { verifySCRYPTHash } from '../crypto/scrypt';
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
    expiresIn: 86_400,
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
        return reject(new Error('Invalid signing problem detected!'));
      }

      return resolve(decoded);
    });
  });
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
  const { PASSWORD_ALGORITHM: algorithm } = config;
  if (algorithm === 'argon2') {
    return verifyArgon2Hash(checked, input);
  }

  if (algorithm === 'bcrypt') {
    return verifyBCRYPTHash(checked, input);
  }

  if (algorithm === 'pbkdf2') {
    return verifyPBKDF2(checked, salt, input);
  }

  if (algorithm === 'scrypt') {
    return verifySCRYPTHash(checked, salt, input);
  }

  const passwordInput = createSHA512HMAC(input, salt);
  return safeCompare(checked, passwordInput);
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
