import type { NextFunction, Request, Response } from 'express';
import joi from 'joi';

import AppError from '../util/appError';
import asyncHandler from '../util/asyncHandler';

/**
 * Schema type for user creations.
 */
const userCreateSchema = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
  name: joi.string().required(),
  address: joi.string().required(),
});

/**
 * Schema type for user updates.
 */
const userUpdateSchema = joi.object({
  username: joi.string(),
  password: joi.string(),
  name: joi.string(),
  address: joi.string(),
});

/**
 * Defines middlewares for users.
 *
 */
class UserMiddleware {
  /**
   * Validates a request before throwing it to the appropriate handler.
   */
  validateCreate = asyncHandler(
    async (req: Request, _: Response, next: NextFunction) => {
      const validationResult = userCreateSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      });

      if (validationResult.error) {
        next(
          new AppError(
            `Validation error: ${validationResult.error.details
              .map((err) => err.message)
              .join(', ')}`,
            400
          )
        );
      }

      next();
    }
  );

  /**
   * Validates a request for user updates.
   */
  validateUpdate = asyncHandler(
    async (req: Request, _: Response, next: NextFunction) => {
      const validationResult = userUpdateSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      });

      if (validationResult.error) {
        next(
          new AppError(
            `Validation error: ${validationResult.error.details
              .map((err) => err.message)
              .join(', ')}`,
            400
          )
        );
      }

      next();
    }
  );
}

export default UserMiddleware;
