import { Request, Response, NextFunction } from 'express';
import { appearanceService } from './appearance.service.js';

export class AppearanceController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appearanceService.getSettings();
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await appearanceService.updateSettings(req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await appearanceService.resetToDefault(req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetSoftUiSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await appearanceService.resetSoftUiDefaults(req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const style = req.params.style || req.body.style || 'general';
      const result = await appearanceService.resetStyle(style, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const appearanceController = new AppearanceController();
