import { scrypt } from 'crypto';

/**
 * Asynchronously generates an SCRYPT hash.
 *
 * @param raw - The raw password
 * @param salt - The salt
 * @returns An SCRYPT hash
 */
const createSCRYPTHash = async (raw: string, salt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    scrypt(raw.normalize(), salt, 64, (err, key) => {
      if (err) {
        return reject(err);
      }

      return resolve(key.toString('hex'));
    });
  });
};

export default createSCRYPTHash;
