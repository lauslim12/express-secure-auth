import type { NextFunction, Request, Response } from 'express';
import express from 'express';

import type { Service as UserService } from '../user/domain';
import AppError from '../util/appError';
import asyncHandler from '../util/asyncHandler';
import type { Service as AuthService } from './domain';
import AuthMiddleware from './middleware';

/**
 * Authentication handler for Express.
 *
 * @param authService - Authentication service
 * @param userService - User service
 * @param authMiddleware - Authentication middleware
 * @returns Express router
 */
const AuthHandler = (
  authService: AuthService,
  userService: UserService,
  authMiddleware: AuthMiddleware
) => {
  const handler = express();

  /**
   * Registers a single user.
   */
  handler.post(
    '/register',
    authMiddleware.validateRegistration,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      if (await userService.getUserByUsername(req.body.username)) {
        next(new AppError('That username has been registered already!', 400));
        return;
      }

      const newUser = await userService.createUser(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Registered successfully!',
        data: newUser,
      });
    })
  );

  /**
   * Logs in a single user.
   */
  handler.post(
    '/login',
    authMiddleware.validateLogin,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const { username, password } = req.body;
      const token = await authService.login({ username, password });
      if (!token) {
        next(new AppError('Invalid username and/or password!', 400));
        return;
      }

      res.status(200).json({
        status: 'sucess',
        message: 'Logged in successfully!',
        token,
      });
    })
  );

  /**
   * Logs out a single user by removing the token from the list of sessions.
   */
  handler.post(
    '/logout',
    authMiddleware.restrict,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      if (!req.sessionKey) {
        next(new AppError('Session key does not exist!', 400));
        return;
      }

      await authService.logout(req.sessionKey);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully!',
      });
    })
  );

  return handler;
};

export default AuthHandler;
