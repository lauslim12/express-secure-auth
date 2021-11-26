import { createHash, randomBytes } from 'crypto';

/**
 * Generates a random salt with size 'size'.
 * We also add a peeper to strengthen our hash.
 *
 * @param size - Size of the random bytes
 * @param peeper - A secret string to be appended to the salt
 * @returns A secure-random salt for passwords
 */
const genSalt = async (size: number, peeper: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    randomBytes(size, (err, buf) => {
      if (err) {
        return reject(err);
      }

      const saltAndPeeper = `${peeper}${buf.toString('hex')}`;
      const hashedSP = createHash('sha512').update(saltAndPeeper).digest('hex');

      return resolve(hashedSP);
    });
  });
};

export default genSalt;
