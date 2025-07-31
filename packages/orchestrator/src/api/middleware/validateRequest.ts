import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createLogger } from '../../utils/logger';

const logger = createLogger('validation-middleware');

export function validateRequest(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed', {
        path: req.path,
        errors,
      });

      res.status(400).json({
        error: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

export function validateQuery(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Query validation failed', {
        path: req.path,
        errors,
      });

      res.status(400).json({
        error: 'Query validation failed',
        errors,
      });
      return;
    }

    req.query = value;
    next();
  };
}

export function validateParams(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Params validation failed', {
        path: req.path,
        errors,
      });

      res.status(400).json({
        error: 'Parameter validation failed',
        errors,
      });
      return;
    }

    req.params = value;
    next();
  };
}