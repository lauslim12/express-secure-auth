import { timingSafeEqual } from 'crypto';

/**
 * Safely compares two strings with 'timingSafeEqual' to prevent timing attacks.
 *
 * @param a - A string
 * @param b - A string
 * @returns A boolean value to check whether both strings are equal or not
 */
const safeCompare = (a: string, b: string) => {
  const equal = timingSafeEqual(
    Buffer.from(a.normalize()),
    Buffer.from(b.normalize())
  );

  return equal;
};

export default safeCompare;
