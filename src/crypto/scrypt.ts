import { scrypt } from 'node:crypto';

import safeCompare from './safeCompare';

/**
 * Asynchronously generates an SCRYPT hash.
 *
 * @param raw - The raw password
 * @param salt - The salt
 * @param keyLength - The key length of the algorithm
 * @returns An SCRYPT hash
 */
export const createSCRYPTHash = async (
  raw: string,
  salt: string,
  keyLength: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    scrypt(raw.normalize(), salt, keyLength, (err, key) => {
      if (err) {
        return reject(err);
      }

      const hash = key.toString('hex');
      const kdf = `$scrypt$${keyLength}$${hash}`;
      return resolve(kdf);
    });
  });

/**
 * Verifies SCRYPT hash with the input.
 *
 * @param checked - A password from the database
 * @param salt - A salt from the database
 * @param input - Input from the user
 * @returns Boolean value whether the SCRPYT hash is correct or not
 */
export const verifySCRYPTHash = async (
  checked: string,
  salt: string,
  input: string
) => {
  // will always fail is passing undefined inputs
  const pieces = checked.split('$');
  const keyLength = Number.parseInt(pieces[2] || '1', 10);
  const hash = pieces[3] || '';

  const userSCRPYT = await createSCRYPTHash(input, salt, keyLength);
  const userHash = userSCRPYT.split('$')[3] || '';

  return safeCompare(hash, userHash);
};
