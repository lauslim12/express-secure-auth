import { createHash, randomBytes } from 'crypto';

/**
 * Generates a random salt with size 'size'.
 * We also add a peeper to strengthen our hash.
 *
 * @param size - Size of the random bytes
 * @param peeper - A secret string to be appended to the salt
 * @returns A secure-random salt for passwords
 */
const genSalt = async (size: number, peeper: string) => {
  const salt = randomBytes(size, (err, buf) => {
    return new Promise((resolve, reject) => {
      if (err) {
        return reject(err);
      }

      return resolve(buf.toString('hex'));
    });
  });

  const saltAndPeeper = `${peeper}${salt}`;
  const hashedSalt = createHash('sha512').update(saltAndPeeper).digest('hex');

  return hashedSalt;
};

export default genSalt;
