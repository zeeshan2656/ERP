import { CreateRoleInput, UpdateRoleInput } from './roles.schema.js';
export declare class RolesService {
    private slugify;
    getRoles(): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        createdAt: string;
        updatedAt: string;
    }[]>;
    getRoleById(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        createdAt: string;
        updatedAt: string;
        permissions: {
            moduleKey: string;
            moduleName: string;
            canView: boolean;
            canAdd: boolean;
            canEdit: boolean;
            canDelete: boolean;
        }[];
    }>;
    createRole(input: CreateRoleInput, actorUserId?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        createdAt: string;
        updatedAt: string;
        permissions: {
            moduleKey: string;
            moduleName: string;
            canView: boolean;
            canAdd: boolean;
            canEdit: boolean;
            canDelete: boolean;
        }[];
    }>;
    updateRole(id: string, input: UpdateRoleInput, actorUserId?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isSystem: boolean;
        userCount: number;
        createdAt: string;
        updatedAt: string;
        permissions: {
            moduleKey: string;
            moduleName: string;
            canView: boolean;
            canAdd: boolean;
            canEdit: boolean;
            canDelete: boolean;
        }[];
    }>;
    deleteRole(id: string, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAvailableModules(): Promise<{
        moduleKey: any;
        name: any;
        description: any;
        iconName: any;
        isCore: boolean;
        isEnabled: boolean;
        category: any;
        actions: string[];
    }[]>;
}
export declare const rolesService: RolesService;
