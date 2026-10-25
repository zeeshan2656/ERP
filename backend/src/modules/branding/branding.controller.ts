import { Request, Response, NextFunction } from 'express';
import { brandingService } from './branding.service.js';

export class BrandingController {
  async getBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await brandingService.getBranding();
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await brandingService.updateBranding(req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const brandingController = new BrandingController();
