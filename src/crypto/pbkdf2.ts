import { pbkdf2 } from 'crypto';

import safeCompare from './safeCompare';

/**
 * Asynchronously generates a PBKDF2 hash.
 * For PBKDF2, recommended iterations are 10000 and derived key length is 64.
 * Salt is recommended to be around 24 bytes.
 *
 * @param raw - The raw password
 * @param salt - The salt
 * @param digest - Digest / algorithm to use
 * @param iterations - Number of iterations to use
 * @param keyLength - Key length of the PBKDF2 hash
 * @returns A PBKDF2 hash
 */
export const createPBKDF2Hash = async (
  raw: string,
  salt: string,
  digest: string,
  iterations: number,
  keyLength: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    pbkdf2(raw.normalize(), salt, iterations, keyLength, digest, (err, key) => {
      if (err) {
        return reject(err);
      }

      const hash = key.toString('hex');
      const kdf = `$pbkdf2$${digest}$${iterations}$${keyLength}$${hash}`;
      return resolve(kdf);
    });
  });

/**
 * Verifies whether strings match or not.
 *
 * @param checked - A password from the database
 * @param salt - A salt from the database
 * @param input - User input
 * @returns Boolean value whether 'checked' is safely equal with 'input'
 */
export const verifyPBKDF2 = async (
  checked: string,
  salt: string,
  input: string
) => {
  // will always fail if passing undefined inputs
  const pieces = checked.split('$');
  const digest = pieces[2] || 'sha512';
  const iterations = parseInt(pieces[3] || '1', 10);
  const keyLength = parseInt(pieces[4] || '1', 10);
  const hash = pieces[5] || '';

  const userPBKDF2 = await createPBKDF2Hash(
    input,
    salt,
    digest,
    iterations,
    keyLength
  );
  const userHash = userPBKDF2.split('$')[5] || '';

  return safeCompare(hash, userHash);
};
