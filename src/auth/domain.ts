/**
 * Represents authentication object.
 */
export type Auth = {
  username: string;
  password: string;
};

/**
 * Represents authentication service.
 */
export interface Service {
  login: (auth: Auth) => Promise<string | null>;
  insertToSession: (userId: string, sessionKey: string) => Promise<void>;
  getFromSession: (sessionKey: string) => Promise<string | null>;
}

/**
 * Represents authentication repository / DAL.
 */
export interface Repository {
  insertToSession: (userId: string, sessionKey: string) => Promise<void>;
  getFromSession: (sessionKey: string) => Promise<string | null>;
}
