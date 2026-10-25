import { Request, Response, NextFunction } from 'express';
export declare class MediaController {
    upload(req: Request, res: Response, next: NextFunction): Promise<void>;
    streamMedia(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const mediaController: MediaController;
