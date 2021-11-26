/**
 * Configure all environment variables for the application.
 */
const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'replace with something more random',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PASSWORD_ALGORITHM: process.env.PASSWORD_ALGORITHM || 'argon2',
  PASSWORD_PEEPER: process.env.PASSWORD_PEEPER || 'randompeeper',
  PORT: process.env.PORT || 8080,
  SESSION_SECRET: process.env.SESSION_SECRET || 'randomsession',
};

export default config;
