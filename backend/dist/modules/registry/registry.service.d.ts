export declare class RegistryService {
    listModules(): Promise<{
        id: string;
        moduleKey: string;
        name: string;
        description: string | null;
        iconName: string;
        routePath: string;
        menuPosition: number;
        isCore: boolean;
        isEnabled: boolean;
        permissionKey: string;
        category: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
    toggleModule(moduleKey: string, isEnabled: boolean, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            moduleKey: string;
            isEnabled: boolean;
        };
    }>;
}
export declare const registryService: RegistryService;
