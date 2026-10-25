import { Request, Response, NextFunction } from 'express';
export declare class RolesController {
    listRoles(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    createRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPermissionsMatrix(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const rolesController: RolesController;
