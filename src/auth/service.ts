import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid/async';

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
  const secretKey = process.env.JWT_SECRET || 'replace with something random';

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
    jwt.sign(payload, secretKey, options, (err, decoded) => {
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

    // check whether passwords are in sync
    if (process.env.PASSWORD_HASH === 'sha512' && process.env.PASSWORD_SALT) {
      const processedPassword = crypto
        .createHmac('sha512', process.env.PASSWORD_SALT)
        .update(auth.password)
        .digest('hex');

      if (
        !crypto.timingSafeEqual(
          Buffer.from(processedPassword),
          Buffer.from(checkedUser.password)
        )
      ) {
        return null;
      }
    } else {
      if (!(await bcrypt.compare(auth.password, checkedUser.password))) {
        return null;
      }
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
