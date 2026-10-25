import { Request, Response, NextFunction } from 'express';
export declare function rateLimiter(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
