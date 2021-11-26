import { createHmac } from 'crypto';

/**
 * Creates a SHA-512 encrypted string with a random salt.
 *
 * @param raw - A raw string
 * @param salt - A salt, or salt + peeper for additional security
 * @returns HEX-encoded SHA-512 hashed string
 */
const createSHA512HMAC = (raw: string, salt: string) => {
  return createHmac('sha512', salt).update(raw.normalize()).digest('hex');
};

export default createSHA512HMAC;
