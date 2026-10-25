import { Request, Response, NextFunction } from 'express';
import { rolesService } from './roles.service.js';

export class RolesController {
  async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rolesService.getRoles();
      res.json({
        success: true,
        data: roles,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await rolesService.getRoleById(id);
      res.json({
        success: true,
        data: role,
      });
    } catch (err) {
      next(err);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await rolesService.createRole(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'Role created successfully.',
        data: role,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await rolesService.updateRole(id, req.body, req.user?.id);
      res.json({
        success: true,
        message: 'Role updated successfully.',
        data: role,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await rolesService.deleteRole(id, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPermissionsMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matrix = await rolesService.getAvailableModules();
      res.json({
        success: true,
        data: matrix,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const rolesController = new RolesController();
