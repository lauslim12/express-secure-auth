import type { NextFunction, Request, Response } from 'express';
import joi from 'joi';

import AppError from '../util/appError';

/**
 * Schema type for user creations.
 */
const userCreateSchema = joi.object({
  username: joi.string().trim().alphanum().required(),
  password: joi.string().min(8).max(25).required(),
  name: joi.string().trim().required(),
  address: joi.string().trim().required(),
});

/**
 * Schema type for user updates.
 */
const userUpdateSchema = joi.object({
  username: joi.string().trim().alphanum(),
  password: joi.string().min(8).max(25),
  name: joi.string().trim(),
  address: joi.string().trim(),
});

/**
 * Defines middlewares for users.
 */
class UserMiddleware {
  /**
   * Validates a request before throwing it to the appropriate handler.
   */
  validateCreate(req: Request, _: Response, next: NextFunction) {
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

  /**
   * Validates a request for user updates.
   */
  validateUpdate(req: Request, _: Response, next: NextFunction) {
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
}

export default UserMiddleware;
