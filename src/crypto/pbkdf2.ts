import { pbkdf2 } from 'crypto';

/**
 * Asynchronously generates a PBKDF2 hash.
 * For PBKDF2, recommended iterations are 10000 and derived key length is 64.
 * Salt is recommended to be around 24 bytes.
 *
 * @param raw - The raw password
 * @param salt - The salt
 * @returns A PBKDF2 hash
 */
const createPBKDF2Hash = async (raw: string, salt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    pbkdf2(raw.normalize(), salt, 50000, 64, 'sha512', (err, key) => {
      if (err) {
        return reject(err);
      }

      return resolve(key.toString('hex'));
    });
  });
};

export default createPBKDF2Hash;
