import { Request, Response, NextFunction } from 'express';
export declare class UsersController {
    listUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const usersController: UsersController;
