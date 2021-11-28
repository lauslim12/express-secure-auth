import compression from 'compression';
import type { Application, NextFunction, Request, Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { WrappedNodeRedisClient } from 'handy-redis';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import RedisStore from 'rate-limit-redis';

import AuthHandler from '../auth/handler';
import AuthMiddleware from '../auth/middleware';
import AuthRepository from '../auth/repository';
import AuthService from '../auth/service';
import MiscHandler from '../misc/handler';
import UserHandler from '../user/handler';
import UserMiddleware from '../user/middleware';
import UserRepository from '../user/repository';
import UserService from '../user/service';
import AppError from '../util/appError';

/**
 * Loads all of the middlewares, routes, and stuff for Express.js.
 *
 * @param app - Express application
 * @param redis - Redis database
 * @returns Loaded Express application
 */
const loadExpress = (app: Application, redis: WrappedNodeRedisClient) => {
  // Load middlewares.
  app.use(express.json({ type: 'application/json', limit: '512b' }));
  app.use(helmet());
  app.use(hpp());
  app.use(compression());

  // Setup logger for safety.
  app.use(morgan('combined'));

  // Prevent XST atttacks by filtering allowed methods.
  app.use((req: Request, _: Response, next: NextFunction) => {
    const allowedMethods = [
      'OPTIONS',
      'HEAD',
      'CONNECT',
      'GET',
      'POST',
      'PUT',
      'DELETE',
    ];

    if (!allowedMethods.includes(req.method)) {
      next(new AppError(`Method ${req.method} is not allowed!`, 405));
      return;
    }

    next();
  });

  // Set up throttling to prevent spam requests.
  const throttler = slowDown({
    store: new RedisStore({
      client: redis.nodeRedis,
      prefix: 'sd-common',
    }),
    windowMs: 15 * 60 * 1000,
    delayAfter: 25,
    delayMs: 200,
  });

  // Set up general limiter.
  const limiter = rateLimit({
    store: new RedisStore({
      client: redis.nodeRedis,
      prefix: 'rl-common',
    }),
    max: 50,
    windowMs: 15 * 60 * 1000,
    handler(_: Request, __: Response, next: NextFunction) {
      next(new AppError('Too many requests! Please try again later!', 429));
    },
  });

  // Set up specific limiter.
  const strictLimiter = rateLimit({
    store: new RedisStore({
      client: redis.nodeRedis,
      prefix: 'rl-sensitive',
    }),
    max: 10,
    windowMs: 5 * 60 * 1000,
    handler(_: Request, __: Response, next: NextFunction) {
      next(
        new AppError(
          'Too many requests for this endpoint! Please try again later!',
          429
        )
      );
    },
  });

  // Define repositories.
  const authRepository = new AuthRepository(redis);
  const userRepository = new UserRepository(redis);

  // Define services.
  const authService = new AuthService(userRepository, authRepository);
  const userService = new UserService(userRepository);

  // Define middlewares.
  const authMiddleware = new AuthMiddleware(authService, userService);
  const userMiddleware = new UserMiddleware();

  // Define handlers by constructing them with our services.
  const authHandler = AuthHandler(authService, userService, authMiddleware);
  const miscHandler = MiscHandler();
  const userHandler = UserHandler(userService, authMiddleware, userMiddleware);

  // Define API routes.
  app.use(throttler);
  app.use('/', miscHandler);
  app.use('/api/v1/authentication', strictLimiter, authHandler);
  app.use('/api/v1/users', limiter, userHandler);

  // Allow 404.
  app.all('*', (req: Request, _: Response, next: NextFunction) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
  });

  // Configure error handlers.
  app.use((err: AppError, _: Request, res: Response, next: NextFunction) => {
    const error = { ...err };

    if (error instanceof SyntaxError) {
      error.message = 'Invalid JSON! Please insert a valid one.';
      error.statusCode = 400;
      error.isOperational = true;
      error.status = 'fail';
    }

    if (error.type === 'entity.too.large') {
      error.message = 'Request body is too large! Please insert a smaller one.';
      error.statusCode = 413;
      error.isOperational = true;
      error.status = 'fail';
    }

    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      next();
      return;
    }

    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'An unknown error occured. Please try again later.',
    });

    next();
  });

  // Return application.
  return app;
};

export default loadExpress;
