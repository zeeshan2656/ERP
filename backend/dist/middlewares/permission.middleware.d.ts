import { Request, Response, NextFunction } from 'express';
type PermissionAction = 'view' | 'add' | 'edit' | 'delete';
export declare function requirePermission(moduleKey: string, action: PermissionAction): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
