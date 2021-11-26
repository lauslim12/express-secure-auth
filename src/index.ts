import express from 'express';

import config from './config';
import loadExpress from './infra/express';
import redis from './infra/redis';

/**
 * Starts our server.
 */
async function startServer() {
  /**
   * Load application.
   */
  const app = loadExpress(express(), redis);

  /**
   * Handles uncaught exceptions to prevent app error before starting.
   */
  process.on('uncaughtException', (err) => {
    console.log('Unhandled exception 💥! Application shutting down!');
    console.log(err.name, err.message);
    process.exit(1);
  });

  /**
   * Run application on port specified in 'config'.
   */
  const server = app.listen(config.PORT, () => {
    console.log(`API has started and is running on port ${config.PORT}!`);
    console.log('API configurations / environment can be seen below:');
    console.log(config);
  });

  /**
   * Handles unhandled rejections, and shut down gracefully.
   */
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection 💥! Application shutting down!');
    console.error(err);

    // Finish all requests that are still pending, the shutdown gracefully.
    server.close(async () => {
      await redis.quit();
      process.exit(1);
    });
  });

  /**
   * Handles 'SIGQUIT' signal.
   */
  process.on('SIGQUIT', () => {
    console.log('Receiving signal to shut down. Shutting down gracefully...');

    server.close(async () => {
      await redis.quit();

      console.log('Server closed successfully!');
      process.exit(0);
    });
  });

  /**
   * Handles 'SIGTERM' signal.
   */
  process.on('SIGTERM', () => {
    console.log('Receiving signal to terminate. Shutting down gracefully...');

    server.close(async () => {
      await redis.quit();

      console.log('Server closed successfully!');
      process.exit(0);
    });
  });

  /**
   * Handles 'SIGINT' signal.
   */
  process.on('SIGINT', () => {
    console.log('Receiving signal to interrupt. Shutting down gracefully...');

    server.close(async () => {
      await redis.quit();

      console.log('Server closed successfully!');
      process.exit(0);
    });
  });
}

/**
 * Simulates 'function main()' in most programming languages.
 */
if (require.main === module) {
  startServer().then(() => console.log('Server has started!'));
}
