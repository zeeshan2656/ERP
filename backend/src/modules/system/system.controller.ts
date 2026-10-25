import { Request, Response, NextFunction } from 'express';
import { systemService } from './system.service.js';
import { checkDbConnection } from '../../config/database.js';

export class SystemController {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbOk = await checkDbConnection();
      res.json({
        success: true,
        status: dbOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbOk ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
      });
    } catch (err) {
      next(err);
    }
  }

  async getSetupStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await systemService.getSetupStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async performSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await systemService.performSetup(req.body, ip, userAgent);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPublicConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await systemService.getPublicConfig();
      res.json({
        success: true,
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const systemController = new SystemController();
