import { Request, Response, NextFunction } from 'express';
export declare class AppearanceController {
    getSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetSoftUiSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetStyle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const appearanceController: AppearanceController;
