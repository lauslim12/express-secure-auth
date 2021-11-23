import type { NextFunction, Request, Response } from 'express';
import express from 'express';

import AuthMiddleware from '../auth/middleware';
import AppError from '../util/appError';
import asyncHandler from '../util/asyncHandler';
import type { Service } from './domain';
import UserMiddleware from './middleware';

/**
 * Create a handler for 'User' entity in our app.
 *
 * @param userService - User service
 * @param authMiddleware - Authentication middlewares
 * @param userMiddleware - User middlewares
 * @returns Express router
 */
const UserHandler = (
  userService: Service,
  authMiddleware: AuthMiddleware,
  userMiddleware: UserMiddleware
) => {
  const handler = express();

  /**
   * Gets all users.
   */
  handler.get(
    '/',
    asyncHandler(async (_: Request, res: Response) => {
      const users = await userService.getUsers();

      res.status(200).json({
        status: 'success',
        message: 'Successfully fetched data of all users!',
        data: users,
      });
    })
  );

  /**
   * Gets a user.
   */
  handler.get(
    '/:username',
    asyncHandler(async (req: Request, res: Response) => {
      const user = await userService.getUserByUsername(
        req.params.username as string
      );

      res.status(200).json({
        status: 'success',
        message: 'Successfully fetched data of a user!',
        data: user,
      });
    })
  );

  /**
   * Creates a new user.
   */
  handler.post(
    '/',
    authMiddleware.restrict,
    userMiddleware.validateCreate,
    asyncHandler(async (req: Request, res: Response) => {
      const newUser = await userService.createUser(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Successfully created a user!',
        data: newUser,
      });
    })
  );

  /**
   * Updates a user.
   */
  handler.put(
    '/:id',
    authMiddleware.restrict,
    userMiddleware.validateUpdate,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const checkedUser = await userService.getUser(req.params.id as string);
      if (!checkedUser) {
        next(
          new AppError(`User with ID: ${req.params.id} does not exist!`, 404)
        );
        return;
      }

      const newUser = await userService.modifyUser(
        req.params.id as string,
        req.body
      );

      res.status(200).json({
        status: 'success',
        message: 'Successfully updated a user!',
        data: newUser,
      });
    })
  );

  /**
   * Deletes a user.
   */
  handler.delete(
    '/:id',
    authMiddleware.restrict,
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const checkedUser = await userService.getUser(req.params.id as string);
      if (!checkedUser) {
        next(
          new AppError(`User with ID: ${req.params.id} does not exist!`, 404)
        );
        return;
      }

      await userService.removeUser(req.params.id as string);

      res.sendStatus(204);
    })
  );

  return handler;
};

export default UserHandler;
