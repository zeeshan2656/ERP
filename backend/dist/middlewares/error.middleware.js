import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    details;
    constructor(message, statusCode = 400, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    // Handle Zod Validation Errors
    if (err instanceof ZodError) {
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle Custom App Errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
        return;
    }
    // Handle unexpected unhandled errors
    logger.error('Unhandled internal server error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
}
//# sourceMappingURL=error.middleware.js.map