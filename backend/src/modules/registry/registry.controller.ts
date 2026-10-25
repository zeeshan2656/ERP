import { Request, Response, NextFunction } from 'express';
import { registryService } from './registry.service.js';

export class RegistryController {
  async listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await registryService.listModules();
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { isEnabled } = req.body;
      const result = await registryService.toggleModule(key, Boolean(isEnabled), req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const registryController = new RegistryController();
