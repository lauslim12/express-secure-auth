import bcrypt from 'bcrypt';

/**
 * Creates a password with BCRYPT hash.
 *
 * @param raw - A raw password
 * @returns A BCRYPT hashed password
 */
export const createBCRYPTHash = async (raw: string) =>
  bcrypt.hash(raw.normalize(), 14);

/**
 * Validates a password, checks whether password is correct or not.
 *
 * @param checked - A password inside the database
 * @param input - A plaintext password
 * @returns Boolean value whether the password is correct or not
 */
export const verifyBCRYPTHash = async (checked: string, input: string) =>
  bcrypt.compare(checked, input.normalize());
