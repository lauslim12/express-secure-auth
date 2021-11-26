import argon2 from 'argon2';

/**
 * Creates an Argon2 hash.
 *
 * @param raw - A raw password
 * @returns A hashed Argon2 password
 */
export const createArgon2Hash = async (raw: string) => {
  return await argon2.hash(raw.normalize(), { timeCost: 250 });
};

/**
 * Compares two passwords (one hashed, one plaintext) to check its validity.
 *
 * @param checked - A password in the database
 * @param input - A password that is supplied by the user
 * @returns Boolean value whether the hash is correct or not
 */
export const verifyArgon2Hash = async (checked: string, input: string) => {
  return await argon2.verify(checked, input.normalize(), { timeCost: 250 });
};
