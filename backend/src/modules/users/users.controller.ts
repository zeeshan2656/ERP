import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { UserQueryInput } from './users.schema.js';

export class UsersController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryInput = req.query as unknown as UserQueryInput;
      const data = await usersService.getUsers(queryInput);
      res.json({
        success: true,
        data: data.items,
        pagination: data.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);
      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.createUser(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.updateUser(id, req.body, req.user?.id);
      res.json({
        success: true,
        message: 'User updated successfully.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await usersService.softDeleteUser(id, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const result = await usersService.toggleUserStatus(id, Boolean(isActive), req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const result = await usersService.adminResetPassword(id, newPassword, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
