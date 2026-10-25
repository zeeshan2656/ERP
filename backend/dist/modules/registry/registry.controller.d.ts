import { Request, Response, NextFunction } from 'express';
export declare class RegistryController {
    listModules(req: Request, res: Response, next: NextFunction): Promise<void>;
    toggleModule(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const registryController: RegistryController;
