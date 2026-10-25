import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    details?: unknown;
    constructor(message: string, statusCode?: number, details?: unknown);
}
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void;
