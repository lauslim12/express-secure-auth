import type { NextFunction, Request, Response } from 'express';
import joi from 'joi';
import type { JwtPayload, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

import config from '../config';
import UserService from '../user/service';
import AppError from '../util/appError';
import asyncHandler from '../util/asyncHandler';
import AuthService from './service';

/**
 * Schema type for logging in.
 */
const authLoginSchema = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
});

/**
 * Schema type for registration.
 */
const authRegistrationSchema = joi.object({
  username: joi.string().trim().alphanum().required(),
  password: joi.string().min(8).max(25).required(),
  name: joi.string().trim().required(),
  address: joi.string().trim().required(),
});

/**
 * Verifies JWT token.
 *
 * @param token - JWT token
 * @returns The parsed, verified token
 */
const verifyToken = async (token: string): Promise<JwtPayload> => {
  const options: VerifyOptions = {
    algorithms: ['HS256'],
    audience: 'if673-general-population',
    issuer: 'esa-nhy',
  };

  return new Promise((resolve, reject) => {
    jwt.verify(token, config.JWT_SECRET, options, (err, decoded) => {
      if (err) {
        return reject(
          new AppError(
            'The integrity of the values inside the JWT cannot be verified!',
            400
          )
        );
      }

      if (!decoded) {
        return reject(new AppError('Unknown and invalid JWT!', 400));
      }

      return resolve(decoded);
    });
  });
};

/**
 * Represents our authentication middleware.
 */
class AuthMiddleware {
  private authService: AuthService;
  private userService: UserService;

  constructor(authService: AuthService, userService: UserService) {
    this.authService = authService;
    this.userService = userService;
  }

  /**
   * Performs validation of a user before allowing him/her to access the protected endpoint.
   */
  restrict = asyncHandler(
    async (req: Request, _: Response, next: NextFunction) => {
      // check authorization header
      const validHeader = req.headers.authorization?.startsWith('Bearer ');
      const token = validHeader
        ? req.headers.authorization?.split(' ')[1]
        : null;
      if (!token) {
        next(new AppError('Invalid bearer token!', 400));
        return;
      }

      // validate JWT, check if it has 'session' payload
      const verifiedToken = await verifyToken(token);
      if (!verifiedToken.sess || !verifiedToken.iat) {
        next(new AppError('Invalid JWT payload!', 400));
        return;
      }

      // verify session key in stateful datastore
      const userId = await this.authService.getFromSession(verifiedToken.sess);
      if (!userId) {
        next(
          new AppError('Session bearing this JWT token does not exist!', 401)
        );
        return;
      }

      // verify whether the user with the previously retrieved user id exists or not
      const loggedUser = await this.userService.getUserComplete(userId);
      if (!loggedUser) {
        next(new AppError('User bearing this JWT token does not exist!', 401));
        return;
      }

      // verify whether the user has recently changed passwords or not
      const timeChangedPassword = Math.floor(
        parseInt(loggedUser.changedPasswordAfter, 10) / 1000
      );
      if (timeChangedPassword > verifiedToken.iat) {
        next(
          new AppError(
            'User bearing this token has recently changed passwords!',
            401
          )
        );
        return;
      }

      // continue next and place 'userid' and 'sessionId' in request variable
      req.userId = loggedUser.id;
      req.sessionKey = verifiedToken.sess;
      next();
    }
  );

  /**
   * Performs input validation for logging in on the request body.
   */
  validateLogin = asyncHandler(
    async (req: Request, _: Response, next: NextFunction) => {
      const result = authLoginSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      });

      if (result.error) {
        next(
          new AppError(
            `Validation error: ${result.error.details
              .map((e) => e.message)
              .join(', ')}`,
            400
          )
        );
        return;
      }

      next();
    }
  );

  /**
   * Performs input validation for registration on the request body.
   */
  validateRegistration = asyncHandler(
    async (req: Request, _: Response, next: NextFunction) => {
      const result = authRegistrationSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      });

      if (result.error) {
        next(
          new AppError(
            `Validation error: ${result.error.details
              .map((e) => e.message)
              .join(', ')}`,
            400
          )
        );
        return;
      }

      next();
    }
  );
}

export default AuthMiddleware;
