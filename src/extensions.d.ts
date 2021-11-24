declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string;
      PASSWORD_HASH?: 'bcrypt' | 'sha512';
      PASSWORD_SALT?: string;
      NODE_ENV?: 'production' | 'development';
    }
  }

  namespace Express {
    export interface Request {
      userId?: string;
      sessionKey?: string;
    }
  }
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    sess?: string;
  }
}

export {};
