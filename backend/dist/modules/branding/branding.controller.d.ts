import { Request, Response, NextFunction } from 'express';
export declare class BrandingController {
    getBranding(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateBranding(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const brandingController: BrandingController;
