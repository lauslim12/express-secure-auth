declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string;
      NODE_ENV?: 'production' | 'development';
      PASSWORD_ALGORITHM?: 'bcrypt' | 'sha512' | 'scrypt' | 'argon2' | 'pbkdf2';
      PASSWORD_PEEPER?: string;
      PORT?: number;
      SESSION_SECRET?: string;
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
