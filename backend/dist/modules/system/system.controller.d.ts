import { Request, Response, NextFunction } from 'express';
export declare class SystemController {
    getHealth(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSetupStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    performSetup(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPublicConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const systemController: SystemController;
